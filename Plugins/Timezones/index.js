const { Styling, DataStore, WebpackModules, Patcher: _Patcher, ContextMenu } = Velocity;

const Patcher = new _Patcher("Timezones");
const Storage = DataStore.Stream("Timezones");

const ProfileBanner = WebpackModules.find((m) => m.default?.toString().includes("e.hasBannerImage") && m.default?.toString().includes("e.hasThemeColors"));
const MessageHeader = WebpackModules.find((m) => m.default?.toString().includes("userOverride") && m.default?.toString().includes("withMentionPrefix"));
const GenericMenu = WebpackModules.find((m) => m.default?.toString().includes("menuItemProps:"));
const TextInput = WebpackModules.common.Components.TextInput.default;
const Markdown = WebpackModules.common.Components.Markdown.default;

module.exports = class extends Velocity.Plugin {
    onStart() {
        Styling.injectCSS(
            "timezones",
            `
        .timezone {
            margin-left: 0.5rem;
            font-size: 0.75rem;
            line-height: 1.375rem;
            color: var(--text-muted);
            vertical-align: baseline;
            display: inline-block;
            height: 1.25rem;
            cursor: default;
            pointer-events: none;
            font-weight: 500;
        }

        .timezone-margin-top {
            margin-top: 0.5rem;
        }

        .timezone-banner-container {
            position: relative;
        }

        .timezone-badge {
            position: absolute;
            bottom: 10px;
            right: 16px;
            background: var(--profile-body-background-color, var(--background-primary));
            border-radius: 4px;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            color: var(--text-normal);
        }
        `
        );

        Patcher.after(GenericMenu, "ZP", ([props], ret) => {
            if (props.navId !== "user-context") return;

            ret.props.children.props.children.props.children[1].push([
                Velocity.ContextMenu.buildMenuItem({ type: "separator" }),
                Velocity.ContextMenu.buildMenuItem({
                    label: "Set Timezone",
                    action: () => {
                        const ref = ret.props.children.ref.current;
                        const fiber = ref.parentElement[Object.keys(ref.parentElement).find((key) => key.startsWith("__react"))];
                        const user = fiber.memoizedProps.children.props.children.props.user;

                        return this.setTimezone(user.id, user);
                    },
                }),
            ]);
        });
        Patcher.after(ProfileBanner, "Z", ([props], ret) => {
            const originalRet = { ...ret };

            if (!this.hasTimezone(props.user.id)) return;

            ret.type = "div";
            ret.props = {
                className: "timezone-banner-container",
                children: [originalRet, <div className="timezone-badge">{this.getLocalTime(props.user.id)}</div>],
            };
        });
        Patcher.after(MessageHeader, "Z", ([props], ret) => {
            this.hasTimezone(props.message.author.id) && ret.props.children.push(<span className="timezone">{this.getLocalTime(props.message.author.id, props.message.timestamp._d)}</span>);
        });
    }
    onStop() {}

    renderSettings() {
        return [
            {
                type: "switch",
                name: "24 Hour Time",
                note: "Use 24 hour time instead of AM/PM",
                id: "twentyFourHour",
            },
        ];
    }

    hasTimezone(id) {
        return !!Storage[id];
    }

    setTimezone(id, user) {
        let hours = 0;
        let minutes = 0;

        Velocity.Notifications.showConfirmationModal({
            title: "Set Timezone",
            content: [
                <Markdown>Please enter an hour offset between -12 and 12 (UTC)</Markdown>,
                <TextInput
                    type="number"
                    maxLength="2"
                    placeholder="0"
                    onChange={(v) => {
                        hours = v;
                    }}
                />,
                <Markdown className="timezone-margin-top">Please enter a minute offset between 0 and 60 (UTC)</Markdown>,
                <TextInput
                    type="number"
                    maxLength="2"
                    placeholder="0"
                    onChange={(v) => {
                        minutes = v;
                    }}
                />,
            ],
            confirmText: "Set",
            onConfirm: () => {
                Storage[id] = [hours, minutes];

                Velocity.Notifications.showNotification({
                    type: "success",
                    title: "Timezone Set",
                    content: `Timezone set to UTC${hours > 0 ? `+${hours}` : hours}${minutes ? `:${minutes}` : ""} for ${user.username}`,
                });
            },
        });
    }

    getLocalTime(id, time) {
        const timezone = Storage[id];
        if (!timezone) return null;

        let hours;
        let minutes;

        if (time) {
            hours = time.getUTCHours() + Number(timezone[0]);
            minutes = time.getUTCMinutes() + Number(timezone[1]);
        } else {
            hours = new Date().getUTCHours() + Number(timezone[0]);
            minutes = new Date().getUTCMinutes() + Number(timezone[1]);
        }

        if (Storage.settings?.twentyFourHour) return `${hours}:${minutes.toString().length === 1 ? `0${minutes}` : minutes}`;

        const hour = hours % 12 || 12;
        const ampm = hours < 12 ? "AM" : "PM";

        return `${hour}:${minutes.toString().length === 1 ? `0${minutes}` : minutes} ${ampm}`;
    }
};
