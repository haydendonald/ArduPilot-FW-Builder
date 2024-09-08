

//TODO: Generate this on the fly from the ardupilot repo ./waf list_boards

export interface Board {
    friendlyName: string;
    hwDefDirectory: string;
}

export class Boards {
    static CubeOrange: Board = { friendlyName: "CubeOrange", hwDefDirectory: `/libraries/AP_HAL_ChibiOS/hwdef/CubeOrange` };




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

export interface LUAFile {
    helperFunctions?: string[]; //Functions to append to the top of the LUA file
    validateSyntax?: boolean; //Validate the syntax of the file
    file?: string | string[]; //The file(s) to include in this file. Multiple files will be combined into one
    outputName?: string //Rename the lua file (output.lua)
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
    gitRepo?: string; //The git repo to use
    gitBranch?: string; //The git branch to use
    git?: {
        reset?: boolean; //Should the git repo be reset before build
    },

    //Parameter options
    parameter?: {
        clear?: boolean; //Clear the defaults param file
        replaceFile?: string; //Replace the defaults param file with another
        append?: Record<string, string>; //Append to the defaults param file
    }

    //LUA options
    lua?: {
        include?: boolean; //Should we include the LUA files
        enableScripting?: boolean; //Should scripting be enabled (Will set/unset SCR_ENABLED)
        luaFiles?: LUAFile[]; //The LUA files to include
    }

    //HWDef options
    hwDef?: {
        clear?: boolean; //Clear the HWDef file
        replaceFile?: string; //Replace the HWDef file with another (The filename in the hwdef directory will not be this file, it will be named hwdef.dat)
        append?: string[]; //Append options to the HWDef file
    }
}