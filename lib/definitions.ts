

//TODO: Generate this on the fly from the ardupilot repo ./waf list_boards

import { Utility } from "./utility";

export interface Board {
    hwDefDirectory: string;
}

export class Boards {
    static CubeOrange: Board = { hwDefDirectory: `/libraries/AP_HAL_ChibiOS/hwdef/CubeOrange` };




    // CubeBlack = "CubeBlack",
    // CubePurple = "CubePurple",
    // CubeYellow = "CubeYellow",
    // CubeBlue = "CubeBlue",
    // CubeGreen = "CubeGreen",
    // CubeRed = "CubeRed",
    // Cube = "Cube",
}

//TODO: Generate this on the fly from the ardupilot repo ./waf list
export enum Target {
    copter = "copter",
    heli = "heli",
    plane = "plane",
    rover = "rover",
    sub = "sub",
    antennatracker = "antennatracker",
    AP_Periph = "AP_Periph"
}

export interface Parameter {
    name: string;
    value: string;
}

export interface HWDef {
    name: string;
    value: string;
}

export interface LUAFile {
    helperFunctions?: string[]; //Functions to append to the top of the LUA file
    validateSyntax?: boolean; //Validate the syntax of the file
    file?: string | string[]; //The file(s) to include in this file. Multiple files will be combined into one
}

//Build options
export interface Build {
    board: Board; //--board
    target: Target | string; //--target
    static?: boolean; //--static
    upload?: boolean; //--upload
    uploadDest?: string; //--rsync-dest root@192.168.1.2:/
    debug?: boolean; //--debug
    distClean?: boolean; ///Run distclean before building

    //Git options
    gitRepo?: string; //The git repop to use
    gitBranch?: string; //The git branch to use
    resetGit?: boolean; //Should the git repo be reset before build

    //Parameter options
    parameter?: {
        clear?: boolean; //Clear the defaults param file
        replaceFile?: string; //Replace the defaults param file with another
        append?: Parameter[]; //Append to the defaults param file
    }

    //LUA options
    lua?: {
        include?: boolean; //Should we include the LUA files
        enableScripting?: boolean; //Should scripting be enabled (Will set/unset SCR_ENABLED)
        luaFiles?: LUAFile[];
    }

    //HWDef options
    hwDef?: {
        clear?: boolean; //Clear the HWDef file
        replaceFile?: string; //Replace the HWDef file with another
        append?: HWDef[]; //Append options to the HWDef file
    }
}