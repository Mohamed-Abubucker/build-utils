'use strict';

const _camelcase = require('camelcase');
const Directory = require('./directory');

const SUPPORTED_PROJECT_TYPES = ['lib', 'cli', 'api', 'aws-microservice'];
const SUPPORTED_LANGUAGES = ['js', 'ts'];

/**
 * Represents project configuration. This class will encapsulate information
 * about projects that should help automate the build/test/deploy toolchain for
 * a project.
 */
module.exports = class Project {
    /**
     * @param {Object} packageConfig Reference to the project configuration.
     *        This is typically the contents of package.json, with an additional
     *        set of properties called `buildMetadata`.
     * @param {Object} [buildMetadata] An optional build metadata object that
     *        will override the build metadata defined within packageConfig.
     */
    constructor(packageConfig, buildMetadata) {
        if (!packageConfig || typeof packageConfig !== 'object') {
            throw new Error('Invalid packageConfig (arg #1)');
        }

        const config = Object.assign({}, packageConfig);
        config.buildMetadata = Object.assign(
            {},
            config.buildMetadata,
            buildMetadata
        );

        this._name = config.name;
        this._unscopedName = config.name.replace(/^@[^/]*\//, '');
        this._version = config.version;
        this._description = config.description;
        this._initProjectProperties(config.buildMetadata);

        const tree = {
            src: null,
            test: {
                unit: null,
                api: null
            },
            infra: null,
            working: {
                src: null,
                test: {
                    unit: null,
                    api: null
                },
                infra: null,
                node_modules: null
            },
            dist: null,
            docs: null,
            node_modules: null,
            coverage: null,
            '.gulp': null,
            '.tscache': null,
            logs: null,
            'cdk.out': null
        };

        if (this._hasExportedTypes) {
            let rootParentDir = tree;
            let workingParentDir = tree.working;

            const exportedTypesDirs = this._exportedTypes.split('/');
            const lastIndex = exportedTypesDirs.length - 1;

            exportedTypesDirs.forEach((dirName, index) => {
                const isLastIndex = index === lastIndex;

                if (!rootParentDir[dirName]) {
                    rootParentDir[dirName] = isLastIndex ? null : {};
                }
                rootParentDir = rootParentDir[dirName];

                if (!workingParentDir[dirName]) {
                    workingParentDir[dirName] = isLastIndex ? null : {};
                }
                workingParentDir = workingParentDir[dirName];
            });
        }

        this._rootDir = Directory.createTree('./', tree);
    }

    /**
     * Initializes project properties using values from a metadata object.
     *
     * @private
     * @param {Object} buildMetadata The metadata to use when initializing
     *        properties.
     */
    _initProjectProperties(buildMetadata) {
        if (!buildMetadata || typeof buildMetadata !== 'object') {
            throw new Error('Invalid buildMetadata (arg #1)');
        }

        const {
            projectType,
            language,
            docker,
            privateNpm,
            privateNpmParams,
            exportedTypes,
            aws
        } = buildMetadata;

        if (SUPPORTED_PROJECT_TYPES.indexOf(projectType) < 0) {
            throw new Error(
                `Invalid projectType (buildMetadata.projectType).\n\tMust be one of: [${SUPPORTED_PROJECT_TYPES}]`
            );
        }

        if (SUPPORTED_LANGUAGES.indexOf(language) < 0) {
            throw new Error(
                `Invalid language (buildMetadata.language)\n\tMust be one of: [${SUPPORTED_LANGUAGES}]`
            );
        }

        this._projectType = projectType;
        this._language = language;
        this._exportedTypes = exportedTypes;

        this._hasTypescript = this._language === 'ts';
        this._hasServer = this._projectType === 'api';
        this._hasDocker =
            this._projectType !== 'lib' && docker && typeof docker === 'object';
        this._hasPrivateNpm = privateNpm && typeof privateNpm === 'object';
        this._hasExportedTypes =
            typeof exportedTypes === 'string' && exportedTypes.length > 0;

        if (this._projectType === 'aws-microservice') {
            if (!aws || typeof aws !== 'object') {
                throw new Error(
                    'The project is an AWS microservice, but does not define AWS configuration'
                );
            }

            if (!aws.stacks || typeof aws.stacks !== 'object') {
                throw new Error(
                    'The project is an AWS microservice, but does not define AWS stacks'
                );
            }

            this._awsRegion = aws.region;
            this._awsProfile = aws.profile;
            this._cdkStacks = aws.stacks;
        } else {
            this._awsRegion = undefined;
            this._awsProfile = undefined;
            this._cdkStacks = {};
        }

        if (this._hasDocker) {
            this._dockerRepo = docker.registry
                ? `${docker.registry}/${this._unscopedName}`
                : this._unscopedName;
        } else {
            this._dockerRepo = undefined;
        }

        if (this._hasPrivateNpm) {
            if (!(privateNpm.params instanceof Array)) {
                throw new Error(
                    'Project uses a private npm repository, but does not define any private npm params'
                );
            }
            this._privateNpmParams = privateNpm.params;
        } else {
            this._privateNpmParams = [];
        }
    }

    /**
     * Initializes a directory tree for the project based on project properties.
     *
     * @private
     */
    _initProjectTree() {
        const tree = {
            src: null,
            test: {
                unit: null,
                api: null
            },
            infra: null,
            working: {
                src: null,
                test: {
                    unit: null,
                    api: null
                },
                infra: null,
                node_modules: null
            },
            dist: null,
            docs: null,
            node_modules: null,
            coverage: null,
            '.gulp': null,
            '.tscache': null,
            logs: null,
            'cdk.out': null
        };

        if (this._projectType === 'aws-microservice') {
            tree.infra = null;
            tree.working.infra = null;
            tree.working.node_modules = null;
            tree['cdk.out'] = null;
        }
    }

    /**
     * An object representation of the project's root directory.
     *
     * @returns {Directory}
     */
    get rootDir() {
        return this._rootDir;
    }

    /**
     * An object representation of the root directory for all javascript files.
     * For typescript projects, this would be the directory containing the
     * transpiled files.
     *
     * @returns {Directory}
     */
    get jsRootDir() {
        return this._hasTypescript
            ? this._rootDir.getChild('working')
            : this._rootDir;
    }

    /**
     * The name of the project as defined in package.json.
     *
     * @return {String}
     */
    get name() {
        return this._name;
    }

    /**
     * The name of the project without including its scope. IF the project has
     * no scope, the unscoped name will match the project name.
     *
     * @return {String}
     */
    get unscopedName() {
        return this._unscopedName;
    }

    /**
     * The version of the project as defined in package.json.
     *
     * @return {String}
     */
    get version() {
        return this._version;
    }

    /**
     * The description of the project as defined in package.json.
     *
     * @return {String}
     */
    get description() {
        return this._description;
    }

    /**
     * Gets the name of the expected configuration file name based on the name
     * of the project.
     */
    get configFileName() {
        return `.${_camelcase(this._unscopedName)}rc`;
    }

    /**
     * The project type of the project (lib/api/cli).
     *
     * @return {String}
     */
    get projectType() {
        return this._projectType;
    }

    /**
     * The language used by the project (js/ts).
     *
     * @return {String}
     */
    get language() {
        return this._language;
    }

    /**
     * Returns the AWS region configured for the project.
     *
     * @return {String}
     */
    get awsRegion() {
        return this._awsRegion;
    }

    /**
     * Returns the AWS profile configured for the project.
     *
     * @return {String}
     */
    get awsProfile() {
        return this._awsProfile;
    }

    /**
     * The path to the docker repository for the project.
     *
     * @return {String}
     */
    get dockerRepo() {
        return this._dockerRepo;
    }

    /**
     * The path to the directory that contains the types exported by this
     * project.
     *
     * @return {String}
     */
    get exportedTypes() {
        return this._exportedTypes;
    }

    /**
     * Determines whether or not the project can be packaged up as a docker
     * image.
     *
     * @return {Boolean}
     */
    get hasDocker() {
        return this._hasDocker;
    }

    /**
     * Determines whether or not the project contains typescript files.
     *
     * @return {Boolean}
     */
    get hasTypescript() {
        return this._hasTypescript;
    }

    /**
     * Determines whether or not the project uses libraries from a private NPM
     * registry.
     *
     * @return {Boolean}
     */
    get hasPrivateNpm() {
        return this._hasPrivateNpm;
    }

    /**
     * Determines whether or not the project has a server component that might
     * require API tests or the ability to host a local server.
     *
     * @return {Boolean}
     */
    get hasServer() {
        return this._hasServer;
    }

    /**
     * Determines if the project has any types to export.
     *
     * @return {String}
     */
    get hasExportedTypes() {
        return this._hasExportedTypes;
    }

    /**
     * Returns a list of required private NPM parameters. These parameters can
     * be checked during build/package time to ensure that they exist, before
     * performing any actions.
     *
     * @return {Array}
     */
    getPrivateNpmParams() {
        return this._privateNpmParams.concat([]);
    }

    /**
     * Checks to see if all required private NPM parameters have been defined in
     * the environment. This is typically a runtime call, executed prior to
     * building/packaging a project.
     */
    validatePrivateNpmParams() {
        this._privateNpmParams.forEach((param) => {
            if (!process.env[param]) {
                throw new Error(
                    `Required npm parameter ${param} not found in environment`
                );
            }
        });
    }

    /**
     * Returns a list of CDK stack keys defined for the project. These stack
     * keys will be used to generate deploy tasks for each. Each key maps to a
     * specific CDK stack that can be deployed.
     *
     * @return {Array} A list of stack keys
     */
    getCdkStacks() {
        return Object.keys(this._cdkStacks);
    }

    /**
     * Returns the name of the stack corresponding to the stack key.
     *
     * @param {String} key The CDK stack key to use when looking up the name.
     * @return {String} The stack name that maps to the key.
     */
    getCdkStackName(key) {
        if (typeof key !== 'string' || key.length <= 0) {
            throw new Error('Invalid stack key (arg #1)');
        }
        return this._cdkStacks[key];
    }
};
