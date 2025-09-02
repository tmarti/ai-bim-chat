import { Annotation } from "@xeokit/xeokit-sdk";
import { ImageReference } from "../ReferenceManagerService";

export interface Snapshot {
    id: string;
    imageReference: ImageReference;
    viewpoint: {
      eye: number[];
      look: number[];
      up: number[];
    };
    annotation: Annotation;
    selectedObjectId: string;
    objectType: string;
  };
  