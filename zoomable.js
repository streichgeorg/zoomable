'use strict'

let zoomable = function() {
    let root = null;
    let summaries = [];

    function measure_dimensions(elt) {
        return [elt.clientWidth, elt.clientHeight];
    }

    function get_overlap(elt) {
        let rect = elt.getBoundingClientRect();

        let l = Math.max(0.0, rect.left);
        let t = Math.max(0.0, rect.top);
        let r = Math.min(window.innerWidth, rect.right);
        let b = Math.min(window.innerHeight, rect.bottom);

        return (b - t) * (r - l) / (window.innerWidth * window.innerHeight);
    }

    function update_visibility() {
        for (let summary of summaries) {
            let overlap = get_overlap(summary.main.firstChild);
            if (overlap < 0.1) {
                summary.main.style.setProperty('visibility', 'hidden');
                summary.summary.style.setProperty('visibility', '');
            } else {
                summary.main.style.setProperty('visibility', '');
                summary.summary.style.setProperty('visibility', 'hidden');
            }
        }
    }

    function setup(from) {
        root = from;

        function transform_in(element) {
            let children = Array.from(element.childNodes).filter(child => child.nodeType == 1);

            // First transform the children of the element
            if (element.querySelector('.zoomable') || element.querySelector('.zoomable-text')) {
                children.forEach(transform_in);
            }

            // Find directly descendant portals
            let portals = children.filter(child => child.matches('.zoomable, .zoomable-text'));
            if (portals.length == 0) return;

            // Move all the children to their own container
            let containers = portals.map(portal => {
                let result = [];

                let main = document.createElement('div');
                main.style.setProperty('display', 'inline-block');

                let main_inner = document.createElement('div');

                while (portal.childNodes.length) main_inner.appendChild(portal.firstChild);
                main.appendChild(main_inner);

                if (portal.querySelector('.zoomable-summary')) {
                    let summary = portal.querySelector('.zoomable-summary');
                    portal.insertBefore(summary, portal.firstChild);

                    summaries.push({
                        main: main,
                        summary: summary
                    });
                }


                result.push({portal: portal, container: main});

                return result;
            }).flat();

            // Measure the dimensions of the full portals
            let dim_full = containers.map(({portal, container}) => {
                document.body.appendChild(container);
                let result = measure_dimensions(container);
                document.body.removeChild(container);

                return result;
            });

            // Remove containers before measuring empty dimensions
            portals.forEach((portal, i) => { portal.innerHTML = ''; });

            // Remeasure the dimensions of the empty portals
            let dim_empty = containers.map(({portal}) => {
                let filler = document.createElement('div');
                filler.style.setProperty('width', '100%');
                filler.style.setProperty('height', '100%');

                portal.appendChild(filler);
                let result = measure_dimensions(filler);
                portal.removeChild(filler);

                return result;
            });

            let dim_elt = measure_dimensions(element);

            // Readd scaled down version of the containers
            containers.forEach(({portal, container}, i) => {
                let inner = container.firstChild;

                let x_scale = dim_empty[i][0] / dim_full[i][0];
                let y_scale = dim_empty[i][1] / dim_full[i][1];

                let full_area = dim_full[i][0] * dim_full[i][1];

                container.style.setProperty('position', 'absolute');

                let is_text = (
                    portal.classList.contains('zoomable-text') &&
                    !container.classList.contains('zoomable-summary')
                );

                let scale;
                if (is_text) {
                    scale = 0.85 * Math.sqrt(
                        (dim_empty[i][0] * dim_empty[i][1]) /
                        full_area
                    );

                    let r = dim_empty[i][0] / dim_empty[i][1];
                    let width = Math.sqrt(r * full_area);
                    let alpha = width / dim_elt[0];

                    container.style.setProperty('width', `${100 * alpha}%`);
                    container.style.setProperty('height', '100%');

                    let n_cols = Math.ceil(full_area / 4e5);
                    inner.style.setProperty('column-count', `${n_cols}`);
                } else {
                    scale = Math.min(x_scale, y_scale);

                    container.style.setProperty('width', '100%');
                    container.style.setProperty('height', '100%');
                }

                inner.style.setProperty('top', '0');
                inner.style.setProperty('left', '0');
                inner.style.setProperty('transform-origin', 'left top');
                inner.style.setProperty('transform', `scale(${scale})`);

                portal.appendChild(container);
            });

            // update_visibility();

            let pz_instance = panzoom(root, {zoomSpeed: 0.05});
            // pz_instance.on('transform', update_visibility);
        }

        transform_in(root);

        root.style.setProperty('transform-origin', 'left top');
    }

    return {
        'setup': setup,
    };
}();

