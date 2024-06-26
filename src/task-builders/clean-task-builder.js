import _delete from 'delete';
import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';

/**
 * Builder that can be used to generate a gulp task to clean temporary project
 * files.
 */
export class CleanTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super(
            'clean',
            'Cleans out working, distribution and temporary files and directories',
        );
    }

    /**
     * Generates a gulp task to clean up temporary project files.
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
        const rootDir = project.rootDir;
        const dirs = ['coverage', 'dist', 'working', '.tscache', 'cdk.out'];

        const paths = dirs.map((dir) => rootDir.getChild(dir).globPath);
        return () => _delete(paths);
    }
}
