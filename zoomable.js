'use strict'

let zoomable = function() {
    let root = null;

    function measure_dimensions(elt) {
        return [elt.clientWidth, elt.clientHeight];
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
                let container = document.createElement('div');
                let inner = document.createElement('div');

                while (portal.childNodes.length) inner.appendChild(portal.firstChild);

                container.appendChild(inner);

                return container;
            });

            // Measure the dimensions of the full portals
            let dim_full = containers.map(container => {
                document.body.appendChild(container);
                container.style.setProperty('display', 'inline-block');
                let result = measure_dimensions(container);
                container.style.setProperty('display', '');
                document.body.removeChild(container);
                return result;
            });

            // Remove containers before measuring empty dimensions
            portals.forEach((portal, i) => { portal.innerHTML = ''; });

            // Remeasure the dimensions of the empty portals
            let dim_empty = portals.map(portal => {
                let filler = document.createElement('div');
                filler.style.setProperty('width', '100%');
                filler.style.setProperty('height', '100%');

                portal.appendChild(filler);
                let result = measure_dimensions(filler);
                portal.removeChild(filler);

                return result;
            });

            // Readd scaled down version of the containers
            portals.forEach((portal, i) => {
                let x_scale = dim_empty[i][0] / dim_full[i][0];
                let y_scale = dim_empty[i][1] / dim_full[i][1];

                let full_area = dim_full[i][0] * dim_full[i][1];

                let scale = 0.9 * Math.sqrt(
                    (dim_empty[i][0] * dim_empty[i][1]) /
                    full_area
                );

                let container = containers[i];
                let inner = container.firstChild;

                container.style.setProperty('position', 'absolute');
                container.style.setProperty('width', `${100 * x_scale / scale}%`);
                container.style.setProperty('height', `${100 * y_scale / scale}%`);

                if (portal.classList.contains('zoomable-text')) {
                    console.log('text');
                    let n_cols = Math.ceil(full_area / 6e5);
                    inner.style.setProperty('column-count', `${n_cols}`);
                }

                inner.style.setProperty('top', '0');
                inner.style.setProperty('left', '0');
                inner.style.setProperty('transform-origin', 'left top');
                inner.style.setProperty('transform', `scale(${scale})`);

                portal.appendChild(container);
            });


            let pz_instance = panzoom(root, {zoomSpeed: 0.05});
            pz_instance.on('zoomend', e => {
                 
            });
        }

        transform_in(root);

        root.style.setProperty('transform-origin', 'left top');
    }

    return {
        'setup': setup,
    };
}();

