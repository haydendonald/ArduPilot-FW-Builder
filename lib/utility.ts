import * as path from "path";
export class Utility {
    static get baseDirectory(): string {
        return process.cwd();
    }

    static get repoDirectory(): string {
        return path.join(Utility.baseDirectory, "repos");
    }

    static get buildDirectory(): string {
        return path.join(Utility.baseDirectory, "build");
    }

    static get randomString(): string {
        return Math.random().toString(36).substring(2);
    }
}