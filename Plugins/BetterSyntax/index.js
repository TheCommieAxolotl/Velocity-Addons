const { Styling, WebpackModules, Patcher: _Patcher } = Velocity;

const Patcher = new _Patcher("BetterSyntax");

module.exports = class extends Velocity.Plugin {
    onStart() {
        Styling.injectCSS(
            "better-syntax",
            `.bettersyntax-info{display:flex;justify-content:flex-end;align-items:center;margin:0.25rem 0 0.75rem;font-family:var(--font-primary);font-size:14px;color:var(--text-muted)}.bettersyntax-info-item{cursor:pointer}.bettersyntax-info-item:hover{color:var(--text-normal);text-decoration:underline}.bettersyntax-bullet{width:4px;height:4px;border-radius:50%;margin:0 5px;opacity:0.5;background-color:var(--text-muted)}`
        );

        const { codeBlock } = WebpackModules.find(["parse", "parseTopic"]).default.defaultRules;

        const Tooltip = WebpackModules.common.Components.TooltipContainer.default;

        Patcher.after(codeBlock, "react", ([props], ret) => {
            if (props.type !== "codeBlock") return;

            Patcher.after(ret.props, "render", (nestedProps, res) => {
                res.props.children = [
                    res.props.children,
                    <div className="bettersyntax-info">
                        <Tooltip
                            text="Copy Language"
                            children={(tProps) => (
                                <div
                                    {...tProps}
                                    className="bettersyntax-info-item"
                                    onClick={() => {
                                        DiscordNative.clipboard.copy(props.lang);
                                    }}
                                >
                                    {props.lang || "none"}
                                </div>
                            )}
                        />
                        <div className="bettersyntax-bullet" />
                        <Tooltip
                            text="Copy Code"
                            children={(tProps) => (
                                <div
                                    {...tProps}
                                    className="bettersyntax-info-item"
                                    onClick={() => {
                                        DiscordNative.clipboard.copy(props.content);
                                    }}
                                >
                                    {props.content.length} characters
                                </div>
                            )}
                        />
                    </div>,
                ];
            });
        });
    }
    onStop() {
        Patcher.unpatchAll();
        Styling.removeCSS("better-syntax");
    }
};
