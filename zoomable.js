'use strict'

let zoomable = function() {
    let root = null;

    function measure_dimensions(elt) {
        let rect = elt.getBoundingClientRect();
        return [rect.width, rect.height];
    }


    function setup(from) {
        root = from;

        function transform_in(element) {
            let children = Array.from(element.childNodes).filter(child => child.nodeType == 1);

            // First transform the children of the element
            if (element.querySelector('.zoomable')) children.forEach(transform_in);

            // Find directly descendant portals
            let portals = children.filter(child => child.matches('.zoomable'));
            if (portals.length == 0) return;

            // Move all the children to their own container
            let containers = portals.map(portal => {
                let container = document.createElement('div');
                while (portal.childNodes.length) container.appendChild(portal.firstChild);

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
                let scale = 0.9 * Math.min(
                    dim_empty[i][0] / dim_full[i][0],
                    dim_empty[i][1] / dim_full[i][1]
                );

                let container = containers[i];

                container.style.setProperty('transform-origin', 'left top');
                container.style.setProperty('transform', `scale(${scale})`);

                portal.appendChild(container);
            });
        }

        transform_in(root);

        root.style.setProperty('transform-origin', 'left top');
    }

    function focus(elt) {
        let dim_elt = measure_dimensions(elt);

        // Important: clear root's transform before measuring root dimensions
        root.style.setProperty('transform', '');
        let dim_root = measure_dimensions(root);

        let scale = Math.min(
            dim_root[0] / dim_elt[0],
            dim_root[1] / dim_elt[1]
        );

        let elt_rect = elt.getBoundingClientRect();

        let transform_str = `scale(${scale}) translate(${-elt_rect.x}px, ${-elt_rect.y}px)`;
        console.log(transform_str);
        root.style.setProperty('transform', transform_str);
    }

    function reset_focus() {
        root.style.setProperty('transform', '');
    }

    return {
        'setup': setup,
        'focus': focus,
        'reset_focus': reset_focus,
    };
}();

