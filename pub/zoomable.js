'use strict'

const zoomable = function() {
    let root;
    let pz_instance;

    const measure_dimensions = elt => [elt.clientWidth, elt.clientHeight];

    function setup(from) {
        root = from;


        function prepare_build(element) {
            const children = Array.from(element.childNodes).filter(child => child.nodeType == 1);

            let childfs = [];

            // First transform the children of the element
            if (element.querySelector('.zoomable') || element.querySelector('.zoomable-text')) {
                childfs = children.map(prepare_build);
            }

            // Find directly descendant portals
            const portals = children.filter(child => child.matches('.zoomable, .zoomable-text'));

            // Move all the children to their own container
            const containers = portals.map(portal => {
                const result = [];

                const main = document.createElement('div');
                main.style.setProperty('display', 'inline-block');

                document.body.appendChild(main);

                const main_inner = document.createElement('div');

                while (portal.childNodes.length) main_inner.appendChild(portal.firstChild);
                main.appendChild(main_inner);

                result.push({portal: portal, container: main});

                return result;
            }).flat();

            return () => {

                childfs.forEach(f => f());

                if (portals.length == 0) return;

                // Remeasure the dimensions of the empty portals
                const dim_empty = containers.map(({portal}) => {
                    const filler = document.createElement('div');
                    filler.style.setProperty('width', '100%');
                    filler.style.setProperty('height', '100%');

                    portal.appendChild(filler);
                    const result = measure_dimensions(filler);
                    portal.removeChild(filler);

                    return result;
                });

                // Measure the dimensions of the full portals
                const dim_full = containers.map(({portal, container}) => {
                    const result = measure_dimensions(container);
                    return result;
                });

                // Readd scaled down version of the containers
                containers.forEach(({portal, container}, i) => {
                    portal.appendChild(container);
                    container.style.setProperty('position', 'absolute');

                    const inner = container.firstChild;

                    const text_mode = portal.classList.contains('zoomable-text');

                    let scale;
                    if (text_mode) {
                        const empty_area = dim_empty[i][0] * dim_empty[i][1];
                        const full_area = dim_full[i][0] * dim_full[i][1];

                        const n_chars = inner.innerHTML.length;
                        const correction = 1 - 0.3 * Math.max(0.25, Math.min(1, 100 / n_chars))

                        scale = correction * Math.sqrt(empty_area / full_area);

                        const dim_container = measure_dimensions(root);

                        const r = dim_empty[i][0] / dim_empty[i][1];
                        const width = Math.sqrt(r * full_area);
                        const alpha = width / dim_container[0];

                        container.style.setProperty('width', `${100 * alpha}%`);
                        container.style.setProperty('height', '100%');
                    } else {
                        const x_scale = dim_empty[i][0] / dim_full[i][0];
                        const y_scale = dim_empty[i][1] / dim_full[i][1];

                        scale = Math.min(x_scale, y_scale);

                        container.style.setProperty('width', '100%');
                        container.style.setProperty('height', '100%');

                    }

                    inner.style.setProperty('top', '0');
                    inner.style.setProperty('left', '0');
                    inner.style.setProperty('transform-origin', 'left top');
                    inner.style.setProperty('transform', `scale(${scale})`);
                });
            };
        }

        // Need to do the layout in two steps, otherwise we won't get a correct measure of the available space
        const buildf = prepare_build(root);
        buildf();

        pz_instance = panzoom(root, {zoomSpeed: 0.05});
    }

    function focus(id, smooth = false) {
        const body_rect = document.body.getBoundingClientRect();

        let compute_center = (elt) => {
            const elt_rect = elt.getBoundingClientRect();

            return [
                elt_rect.left + elt_rect.width / 2,
                elt_rect.top + elt_rect.height / 2,
            ];
        };

        const element = document.querySelector(`#${id}`);
        const elt_rect = element.getBoundingClientRect();

        const scale = Math.min(
            window.innerWidth / elt_rect.width,
            window.innerHeight / elt_rect.height,
        );

        const center = compute_center(element);
        const center_vp = [window.innerWidth / 2, window.innerHeight / 2];

        console.log(center);
        console.log(center_vp);

        if (!smooth) {
            pz_instance.moveTo(center_vp[0] - center[0], center_vp[1] - center[1]);
            pz_instance.zoomTo(center_vp[0], center_vp[1], scale);
        }
    }

    return {
        setup,
        focus,
    };
}();

