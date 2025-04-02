/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
module.exports = {
    default: {
        parallel: 1,
        format: ["html:./reports/cucumber-report.html", "json:./reports/cucumber-report.json"],
        paths: ["./features"],
        import: ["./lib"],
        tags: "not @skip",
    },
};
