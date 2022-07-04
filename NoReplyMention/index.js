const GLOBAL_NAME = "NoReplyMention";

const { showToast, WebpackModules, Patcher } = VApi;

module.exports = {
    Plugin: new (class {
        config = {
            info: {
                name: GLOBAL_NAME,
                description: "Disables Reply pings by default.",
            },
            author: "TheCommieAxolotl",
            authorId: "538487970408300544",
            version: "1.0.0",
            license: "MIT",
        };
        getName() {
            return this.config.info.name;
        }
        async onStart() {
            Patcher.before(GLOBAL_NAME, WebpackModules.find(["createPendingReply"]), "createPendingReply", (data, e) => {
                data[0].shouldMention = false;
            });
        }
        onStop() {
            Patcher.unpatchAll(GLOBAL_NAME);
        }
    })(),
};
