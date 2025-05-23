import path from "node:path";

import {
  type Tool,
  type PackageJSON,
  type Packages,
  InvalidMonorepoError,
} from "./Tool.ts";
import {
  expandPackageGlobs,
  expandPackageGlobsSync,
} from "./expandPackageGlobs.ts";
import { readJson, readJsonSync } from "./utils.ts";

export interface YarnPackageJSON extends PackageJSON {
  workspaces?: string[] | { packages: string[] };
}

export const YarnTool: Tool = {
  type: "yarn",

  async isMonorepoRoot(directory: string): Promise<boolean> {
    try {
      const pkgJson = (await readJson(
        directory,
        "package.json"
      )) as YarnPackageJSON;
      if (pkgJson.workspaces) {
        if (
          Array.isArray(pkgJson.workspaces) ||
          Array.isArray(pkgJson.workspaces.packages)
        ) {
          return true;
        }
      }
    } catch (err) {
      if (err && (err as { code: string }).code === "ENOENT") {
        return false;
      }
      throw err;
    }
    return false;
  },

  isMonorepoRootSync(directory: string): boolean {
    try {
      const pkgJson = readJsonSync(
        directory,
        "package.json"
      ) as YarnPackageJSON;
      if (pkgJson.workspaces) {
        if (
          Array.isArray(pkgJson.workspaces) ||
          Array.isArray(pkgJson.workspaces.packages)
        ) {
          return true;
        }
      }
    } catch (err) {
      if (err && (err as { code: string }).code === "ENOENT") {
        return false;
      }
      throw err;
    }
    return false;
  },

  async getPackages(directory: string): Promise<Packages> {
    const rootDir = path.resolve(directory);

    try {
      const pkgJson = (await readJson(
        rootDir,
        "package.json"
      )) as YarnPackageJSON;
      const packageGlobs: string[] = Array.isArray(pkgJson.workspaces)
        ? pkgJson.workspaces
        : pkgJson.workspaces!.packages;

      return {
        tool: YarnTool,
        packages: await expandPackageGlobs(packageGlobs, rootDir),
        rootPackage: {
          dir: rootDir,
          relativeDir: ".",
          packageJson: pkgJson,
        },
        rootDir,
      };
    } catch (err) {
      if (err && (err as { code: string }).code === "ENOENT") {
        throw new InvalidMonorepoError(
          `Directory ${rootDir} is not a valid ${YarnTool.type} monorepo root`
        );
      }
      throw err;
    }
  },

  getPackagesSync(directory: string): Packages {
    const rootDir = path.resolve(directory);

    try {
      const pkgJson = readJsonSync(rootDir, "package.json") as YarnPackageJSON;
      const packageGlobs: string[] = Array.isArray(pkgJson.workspaces)
        ? pkgJson.workspaces
        : pkgJson.workspaces!.packages;

      return {
        tool: YarnTool,
        packages: expandPackageGlobsSync(packageGlobs, rootDir),
        rootPackage: {
          dir: rootDir,
          relativeDir: ".",
          packageJson: pkgJson,
        },
        rootDir,
      };
    } catch (err) {
      if (err && (err as { code: string }).code === "ENOENT") {
        throw new InvalidMonorepoError(
          `Directory ${rootDir} is not a valid ${YarnTool.type} monorepo root`
        );
      }
      throw err;
    }
  },
};
