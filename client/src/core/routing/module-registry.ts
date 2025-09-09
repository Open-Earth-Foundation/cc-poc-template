import { ModuleRegistry } from "@/core/types/module";
import BoundaryEditor from "@/modules/boundary/pages/boundary-editor";

// Module registry - this is where new modules can be registered
export const moduleRegistry: ModuleRegistry = {
  boundary: {
    id: "boundary",
    name: "Boundary Editor",
    description: "Interactive OpenStreetMap boundary selection and editing",
    routes: [
      {
        path: "/boundary-editor/:cityId",
        component: BoundaryEditor,
      },
    ],
    enabled: true,
  },
  // Future modules can be added here:
  // gallery: {
  //   id: "gallery",
  //   name: "City Gallery",
  //   description: "City image gallery and visualization",
  //   routes: [
  //     {
  //       path: "/city-gallery/:cityId", 
  //       component: CityGallery,
  //     },
  //   ],
  //   enabled: true,
  // },
};