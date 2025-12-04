import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Inner Space",
  version: packageJson.version,
  copyright: `© ${currentYear}, Inner Space.`,
  meta: {
    title: "Inner Space",
    description: "Inner Space",
  },
  // ✅ Add your base path here
  basePath: "/streemlyne",
};
