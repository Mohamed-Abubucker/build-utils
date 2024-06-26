import _path from 'path';
import _gulp from 'gulp';
import _gulpJsdoc from 'gulp-jsdoc3';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';

/**
 * Builder that can be used to generate a gulp task to generate documentation
 * from code comments in javascript files.
 */
export class DocsJsTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super(
            'docs-js',
            'Generates documentation from code comments in javascript files',
        );
    }

    /**
     * Generates a gulp task to generate documentation from code comments in
     * source code.
     *
     * @protected
     * @param {Object} project Reference to the project for which the task needs
     * to be defined.
     *
     * @returns {Function} A gulp task.
     */
    _createTask(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }

        const { rootDir, name, version } = project;
        const docsDir = rootDir.getChild('docs');

        const dirs = ['src'];
        const extensions = ['js'];
        const options = {
            opts: {
                readme: rootDir.getFilePath('README.md'),
                destination: docsDir.getFilePath(
                    `${name}${_path.sep}${version}`,
                ),
                template: _path.join('node_modules', 'docdash'),
            },
        };

        const paths = dirs
            .map((dir) => project.rootDir.getChild(dir))
            .map((dir) => extensions.map((ext) => dir.getAllFilesGlob(ext)))
            .reduce((result, arr) => result.concat(arr), []);

        const task = () =>
            _gulp
                .src(paths, {
                    allowEmpty: true,
                    base: project.rootDir.globPath,
                })
                .pipe(_gulpJsdoc(options))
                .on('error', (err) => {
                    /*
                     * Do nothing. This handler prevents the gulp task from
                     * crashing with an unhandled error.
                     */
                    console.error(err);
                });
        return task;
    }
}
