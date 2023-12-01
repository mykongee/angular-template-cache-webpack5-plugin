const fs = require('fs');
const glob = require('glob');
const path = require('path');
const jsesc = require('jsesc');
const globParent = require('glob-parent');
const webpack = require('webpack');
const lodashTemplate = require('lodash.template');
const htmlMinifier = require('html-minifier');
const uglify = require('uglify-js');
const { optimize, extendDefaultPlugins } = require('svgo');
class AngularTemplateCacheWebpackPlugin {
    constructor(options) {
        const TEMPLATE_HEADER =
            "angular.module('<%= module %>'<%= standalone %>).run(['$templateCache', function($templateCache) {";
        const TEMPLATE_BODY = '$templateCache.put("<%= url %>","<%= contents %>");';
        const TEMPLATE_SVG_BODY = '$templateCache.put("<%= url %>",`<%= contents %>`);';

        const TEMPLATE_FOOTER = '}]);';
        const DEFAULT_FILENAME = 'templates.js';
        const DEFAULT_MODULE = 'templates';

        const userOptions = options || {};

        const defaultOptions = {
            isProd: userOptions.isProd === undefined ? '' : userOptions.isProd,
            source: userOptions.source === undefined ? '' : userOptions.source,
            root: userOptions.root === undefined ? '' : userOptions.root,
            destination: userOptions.destination === undefined ? '' : userOptions.destination,
            outputFilename: userOptions.outputFilename === undefined ? DEFAULT_FILENAME : userOptions.outputFilename,
            module: userOptions.module === undefined ? DEFAULT_MODULE : userOptions.module,
            modules: userOptions.module === undefined ? DEFAULT_MODULE : userOptions.modules,
            templateHeader: userOptions.templateHeader === undefined ? TEMPLATE_HEADER : userOptions.templateHeader,
            templateBody: userOptions.templateBody === undefined ? TEMPLATE_BODY : userOptions.templateBody,
            templateSvgBody: userOptions.templateSvgBody === undefined ? TEMPLATE_SVG_BODY : userOptions.templateSvgBody,
            templateFooter: userOptions.templateFooter === undefined ? TEMPLATE_FOOTER : userOptions.templateFooter,
            escapeOptions: userOptions.escapeOptions === undefined ? {} : userOptions.escapeOptions,
            standalone: !!userOptions.standalone,
            getTemplateCacheKey: userOptions.getTemplateCacheKey,
        };

        this.options = Object.assign(defaultOptions, userOptions);

        this.init();
    }

    apply(compiler) {
        const outputNormal = {};

        compiler.hooks.thisCompilation.tap('AngularTemplateCacheWebpackPlugin', compilation => {
            this.modules.forEach(module => {
                this.files[module.moduleName].forEach(f => compilation.fileDependencies.add(path.join(compiler.context, f)));
                compilation.hooks.additionalAssets.tapAsync('AngularTemplateCacheWebpackPlugin', cb => {
                    this.processTemplates(module);

                    const dest = compiler.options.output.path;
                    const outputPaths = [];

                    this.options.destination.forEach((folder) => outputPaths.push(path.resolve(dest, folder)));
                    let cachedTemplates = '';

                    this.templatelist.forEach(template => {
                        cachedTemplates += template + '\n';
                    });

                    outputPaths.forEach(outputPath => {
                        outputNormal[outputPath] = {
                            filename: outputPath + '/' + module.outputFilename,
                            content: cachedTemplates,
                            size: cachedTemplates.length,
                        }
                    });

                    for (const [key, value] of Object.entries(outputNormal)) {
                        compilation.emitAsset(value.filename, new webpack.sources.RawSource(value.content));
                    }
                    cb();
                });
            });
            });
        }

    init() {
        this.files = {};
        this.modules = this.options.modules;
        this.moduleToRoot = {};
        this.modules.forEach(module => {
            const moduleSourceFiles = typeof module.source === 'string' ? glob.sync(module.source) : module.source;
            this.moduleToRoot[module.moduleName] = module.root;
            this.files[module.moduleName] = [];
            if (Array.isArray(moduleSourceFiles)) {
                moduleSourceFiles.forEach((pattern) => this.files[module.moduleName].push(...glob.sync(pattern)));
            } else {
                this.files[module.moduleName].push(module.source);
            }
        });
        this.fileNameToTemplateCacheKey = this.options.fileNameToTemplateCacheKey
        this.templateBody = this.options.templateBody;
        this.templateSvgBody = this.options.templateSvgBody;
        this.templateHeader = this.options.templateHeader;
        this.templateFooter = this.options.templateFooter;
    }

    processTemplates(module) {
        this.templatelist = [];
        this.processHeader(module);
        this.processBody(module);
        this.processFooter(module);
    }

    processHeader(module) {
        let header = lodashTemplate(this.templateHeader)({
            module: module.moduleName,
            standalone: this.options.standalone ? ', []' : '',
        });
        this.templatelist.unshift(header);
    }

    processBody(module) {
        const optimizeSVG = (fileSource, filePrefix) => optimize(fileSource,{
            cleanupIDs: {
                minify: true,
                prefix: `${filePrefix}-`,
            },
            removeViewBox: false,
            multipass: true,
        }).data;

        this.files[module.moduleName].forEach(file => {
            const tpl = {};
            tpl.source = fs.readFileSync(file);
            const isSvg = (path.extname(file) === '.svg');
            
            if (isSvg) {
                const prefix = path.basename(file, path.extname(file));
                tpl.source = optimizeSVG(tpl.source, prefix);
            } else { 
                tpl.source = htmlMinifier.minify(
                    tpl.source.toString(), {
                            collapseBooleanAttributes:      false,
                            collapseWhitespace:             true,
                            conservativeCollapse:           true,
                            removeAttributeQuotes:          true,
                            removeComments:                 true,
                            removeEmptyAttributes:          false,
                            // Because bootstrap styles input[type="text"]
                            removeRedundantAttributes:      false,
                            removeScriptTypeAttributes:     true,
                            removeStyleLinkTypeAttributes:  true,
                    },
                );
            }
            let htmlRootDir = globParent(this.options.source);
            let filename = path.relative(htmlRootDir, file);
            let url = path.join(this.moduleToRoot[module.moduleName], filename);
            if (this.options.root === '.' || this.options.root.indexOf('./') === 0) {
                url = './' + url;
            } 
            if (isSvg) {
                tpl.source = lodashTemplate(this.templateSvgBody)({
                    url: this.options.getTemplateCacheKey(url),
                    contents: tpl.source
                });
            } else {
                tpl.source = lodashTemplate(this.templateBody)({
                    url: this.options.getTemplateCacheKey(url),
                    contents: jsesc(tpl.source.toString('utf8'), this.options.escapeOptions),
                });
            }
            this.templatelist.push(tpl.source);
        });
    }

    processFooter(module) {
        this.templatelist.push(this.templateFooter);
    }
}

module.exports = AngularTemplateCacheWebpackPlugin;
