import { Project } from '../project.js';
import { LibTaskFactory } from '../task-factories/lib-task-factory.js';
import { ApiTaskFactory } from '../task-factories/api-task-factory.js';
import { CliTaskFactory } from '../task-factories/cli-task-factory.js';
import { AwsMicroserviceTaskFactory } from '../task-factories/aws-microservice-task-factory.js';
import { UiTaskFactory } from '../task-factories/ui-task-factory.js';
import { ContainerTaskFactory } from '../task-factories/container-task-factory.js';

/**
 * For a project that has multiple containers defined, this function will return
 * the additional tasks for each container. These tasks may be called by name
 * following the naming convention package-container-${targetContainerName} and
 * publish-container-${targetContainerName} for example.
 *
 * @param {Project} project The project for which to generate additional package
 * and publish tasks.
 * @param {Function} additionalTaskList A function that returns the set of task
 * builders to be generated for each container. Takes container target as input.
 * @returns {Array} An array of tasks, empty if no extra containers are defined
 */
export function generateAdditionalContainerTasks(project, additionalTaskList) {
    if (!(project instanceof Project)) {
        throw new Error('Invalid project (arg #1)');
    }

    if (typeof additionalTaskList !== 'function') {
        throw new Error('Invalid additionalTaskList (arg #2)');
    }

    const tasks = [];
    const containerTargets = project.getContainerTargets();

    // > 1 since default container
    if (containerTargets.length > 1) {
        containerTargets
            .filter((target) => target !== 'default')
            .forEach((target) => {
                tasks.push(...additionalTaskList(target));
            });
    }

    return tasks;
}

/**
 * Initializes a task factory for a given project type.
 *
 * @param {Project} project The project to generate build tasks for.
 * @returns {TaskFactory} A task factory for the given project type.
 */
export function getTaskFactory(project) {
    if (!(project instanceof Project)) {
        throw new Error('Invalid project (arg #1)');
    }
    if (project.type === 'lib') {
        return new LibTaskFactory(project);
    } else if (project.type === 'api') {
        return new ApiTaskFactory(project);
    } else if (project.type === 'cli') {
        return new CliTaskFactory(project);
    } else if (project.type === 'ui') {
        return new UiTaskFactory(project);
    } else if (project.type === 'aws-microservice') {
        return new AwsMicroserviceTaskFactory(project);
    } else if (project.type === 'container') {
        return new ContainerTaskFactory(project);
    } else {
        throw new Error(`Unrecognized project type (value=${project.type})`);
    }
}
