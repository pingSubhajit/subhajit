export type GalleryPhotoSource = {
  /** Public URL path to the original file (served from `public/`). Example: `/photos/rome-01.jpg` */
  src: string;
  title: string;
  shotUsing: string;
  location: string;
  description: string;
};

export type GalleryPhoto = GalleryPhotoSource & {
  id: string;
  /** Intrinsic original image dimensions */
  width: number;
  height: number;
  /** Public URL path to the generated thumbnail */
  thumbSrc: string;
  thumbWidth: number;
  thumbHeight: number;
};

export type GalleryManifest = {
  generatedAt: string;
  thumb: {
    width: number;
    quality: number;
    format: "jpeg";
  };
  photos: GalleryPhoto[];
};

