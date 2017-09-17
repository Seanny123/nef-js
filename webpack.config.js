var path = require("path");
var webpack = require("webpack");

var config = {
    context: __dirname, // Paths are relative to nengo_gui
    // Putting the entry point in a list is a workaround for this error:
    // Error: a dependency to an entry point is not allowed
    entry: {
        nef: "./src/spike_filter.ts",
    },
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "[name].js",
        publicPath: "/dist/" // Fixes issue finding emitted files
    },
    resolve: {
        extensions: [".js", ".json", ".ts"]
    },
    module: { rules: [
        {
            test: /\.ico$/,
            use: { loader: "file-loader", options: { name: "[name].[ext]" } },
        },
        {
            test: /\.(png|jpg|gif)$/,
            use: { loader: "url-loader", options: { limit: 8192 } },
        },
        {
            test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            use: {
                loader: "url-loader",
                options: {
                    limit: 8192,
                    mimetype: "application/font-woff",
                    name: "./[hash].[ext]",
                },
            }
        },
        {
            test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            use: { loader: "file-loader", options: { name: "./[hash].[ext]" } },
        },
        { test: /\.tsx?$/, use: "ts-loader" },
    ]},
    plugins : [],
}

module.exports = (env) => {
    return config;
}
