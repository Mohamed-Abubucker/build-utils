import { Project } from './project.js';

/**
 * Represents a builder class that can construct a Gulp task. This abstract base
 * class must be extended by child classes that provide the required
 * implementation.
 */
export default class TaskBuilder {
    /**
     * Creates a task builder with the given name and description.
     *
     * @param {string} name The name of the task - this will be the name
     * recognized by gulp, and must be unique.
     * @param {string} description The description of the task - this will be
     * the description shown by gulp.
     */
    constructor(name, description) {
        if (typeof name !== 'string' || name.length <= 0) {
            throw new Error('Invalid name (arg #1)');
        }
        if (typeof description !== 'string' || description.length <= 0) {
            throw new Error('Invalid description (arg #2)');
        }

        this._name = name;
        this._description = description;
    }

    /**
     * Creates a new task - needs to be implemented by a child class.
     *
     * @protected
     * @param {Object} project The project for which the task will be created.
     * @returns {Function} A gulp task
     */
    _createTask(project) {
        throw new Error('Not implemented - TaskBuilder._createTask()');
    }

    /**
     * Gets the name of the task.
     *
     * @returns {String} The task name.
     */
    get name() {
        return this._name;
    }

    /**
     * Gets the description of the task.
     *
     * @returns {String} The task description.
     */
    get description() {
        return this._description;
    }

    /**
     * Builds and returns a Gulp task.
     *
     * @param {Object} project The project for which the task will be created.
     * @returns {Function} A gulp task
     */
    buildTask(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        const task = this._createTask(project);
        task.displayName = this._name;
        task.description = this._description;
        return task;
    }

    /**
     * Returns an array of paths that should be watched for changes when
     * enabling watch (monitor and execute tasks). No watch tasks will be
     * created if this method returns a falsy value or an empty array
     *
     * The default implementation returns an array that watches source files.
     * This implementation can be overridden by child classes to provide
     * specific paths for the task.
     *
     * @param {Object} project The project used to generate watch tasks.
     * @returns {Array} An array of paths to watch.
     */
    getWatchPaths(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        const dirs = ['src', 'test', 'infra'];
        const exts = ['md', 'html', 'json', 'js', 'jsx', 'ts', 'tsx'];
        return dirs
            .map((dir) =>
                exts.map((ext) =>
                    project.rootDir.getChild(dir).getAllFilesGlob(ext),
                ),
            )
            .flat();
    }
}
