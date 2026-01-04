import { combineConfig, Facet } from '@codemirror/state';
export const indentationMarkerConfig = Facet.define({
    combine(configs) {
        return combineConfig(configs, {
            highlightActiveBlock: true,
            hideFirstIndent: false,
            markerType: "fullScope",
            thickness: 1,
        });
    }
});
