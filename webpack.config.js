const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'public'),
        clean: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Output Management',
            template: './src/index.html',
            filename: './index.html'
        }),
    ],
    module: {
        rules: [
            {
                test: /\.(png|svg|jpg|jpeg|gif|obj|mtl)$/i,
                type: 'asset/resource',
            },
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 9000
    },
};
