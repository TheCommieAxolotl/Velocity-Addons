const { Logger, WebpackModules, Patcher } = VApi;

module.exports = {
    Plugin: new (class {
        get DiscordConstants() {
            return WebpackModules.find(["Permissions", "ActivityTypes", "StatusTypes"]);
        }
        get Domain() {
            return this.DiscordConstants.PRIMARY_DOMAIN;
        }
        get Routes() {
            return this.DiscordConstants.Routes;
        }

        config = {
            info: {
                name: "NoCanaryLinks",
                description: "Test",
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
            this.hasPatchedMessage = false;
            this.hasPatchedChannel = false;

            Patcher(this.getName(), WebpackModules.find("MenuItem"), "default", (props, res) => {
                if (!this.hasPatchedChannel) {
                    if (res.props.id === "channel-context-channel-copy-link") {
                        Logger.log(this.getName(), "Patching Channel MenuItem");
                        this.hasPatchedChannel = true;
                        Patcher(this.getName(), WebpackModules.find("useChannelCopyLinkItem"), "default", (newProps, ret) => {
                            this.channelCopyLink(newProps, ret);
                        });
                    }
                }

                if (this.hasPatchedMessage) return;
                if (res.props.id == "message-copy-link") {
                    Logger.log(this.getName(), "Patching Message MenuItem");
                    this.hasPatchedMessage = true;
                    Patcher(this.getName(), WebpackModules.find("useMessageCopyLinkItem"), "default", (newProps, ret) => {
                        this.messageCopyLink(newProps, ret);
                    });
                }
            });
            const MessageMenuItems = WebpackModules.find(["copyLink", "pinMessage"]);
            Patcher(this.getName(), MessageMenuItems, "copyLink", (props) => {
                Logger.log(this.getName(), "Patching MiniPopover");
                this.buttonCopyLink(props);
            });
        }
        onStop() {
            Patcher.unpatchAll(this.getName());
        }

        messageCopyLink(args, reactElement) {
            if (reactElement) {
                reactElement.props.action = () => {
                    this.copyLink(args[1], args[0]);
                };
            }
            return reactElement;
        }
        channelCopyLink(args, reactElement) {
            reactElement.props.action = () => {
                this.copyLink(args[0]);
            };
            return reactElement;
        }

        buttonCopyLink(args) {
            this.copyLink(args[0], args[1]);
        }

        copyLink(channel, message) {
            let url;
            if (message === undefined || message["id"] === undefined) {
                url = location.protocol + "//" + this.Domain + this.Routes.CHANNEL(channel.guild_id, channel.id);
            } else {
                url = location.protocol + "//" + this.Domain + this.Routes.CHANNEL(channel.guild_id, channel.id, message.id);
            }
            DiscordNative.clipboard.copy(url);
        }
    })(),
};
