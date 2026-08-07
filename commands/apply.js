module.exports = {
    data: {
        name: 'unused',
        toJSON() {
            return { name: 'unused', description: 'This command is disabled' };
        }
    },
    async execute() {}
};