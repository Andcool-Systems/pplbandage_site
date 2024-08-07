"use client";

import React, { ChangeEvent, useEffect } from 'react';
import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/app/modules/utils/api.module";
import { redirect } from "next/navigation";
import Style from "@/app/styles/me/connections.module.css";
import Style_themes from "@/app/styles/me/themes.module.css";
import Header from "@/app/modules/components/header.module";
import useCookie from '@/app/modules/utils/useCookie.module';
import Image from 'next/image';
import { Me } from '@/app/modules/components/me.module';
import { Fira_Code } from "next/font/google";
import { SlideButton } from '@/app/modules/components/nick_search.module';
import { formatDate } from '@/app/modules/components/card.module';
import { getTheme } from '@/app/modules/providers.module';
import { useCookies } from 'next-client-cookies';
const fira = Fira_Code({ subsets: ["latin"] });

interface SettingsResponse {
    statusCode: number,
    public_profile: boolean,
    can_be_public: boolean,
    connections: {
        discord: {
            user_id: number,
            username: string,
            name: string,
            connected_at: Date,
            avatar: string
        },
        minecraft?: {
            nickname: string,
            uuid: string,
            last_cached: number,
            head: string,
            valid: boolean,
            autoload: boolean
        }
    }
}

const b64Prefix = "data:image/png;base64,";

const Page = () => {
    const [loaded, setLoaded] = useState<boolean>(false);
    const logged = useCookie('sessionId');
    if (!logged) redirect('/me');

    useEffect(() => {
        if (!logged) {
            redirect('/me');
        }
    }, [logged]);

    const { data, refetch } = useQuery({
        queryKey: ["userConnections"],
        retry: false,
        queryFn: async () => {
            const res = await authApi.get("user/me/settings");
            const data = res.data as SettingsResponse;
            setLoaded(true);
            return data;
        },
    });


    return (
        <body>
            <title>Настройки · Повязки Pepeland</title>
            <meta name="description" content="Настройте свой аккаунт здесь." />
            <meta name="og:title" content="Настройки · Повязки Pepeland" />
            <meta name="og:description" content="Настройте свой аккаунт здесь." />
            <Header />
            {logged &&
                <Me>
                    <div className={Style.main} style={loaded ? { opacity: "1", transform: "translateY(0)" } : { opacity: "0", transform: "translateY(50px)" }}>
                        {data &&
                            <>
                                <UserSettings data={data} />
                                <Connections data={data} refetch={refetch} />
                                <Themes />
                            </>
                        }
                    </div>
                </Me>
            }
        </body >
    );
}

const UserSettings = ({ data }: { data: SettingsResponse }) => {
    const [value, setValue] = useState<boolean>(data?.public_profile);
    const change = (val: boolean) => {
        authApi.put('user/me/settings/set_public', {}, { params: { state: val } }).then((response) => {
            if (response.status === 200) {
                setValue(response.data.new_data);
            }
        })
    }
    return (
        <div className={Style.container}>
            <h3><Image src="/static/icons/user.svg" alt="" width={26} height={26} style={{ marginRight: ".3rem", borderRadius: 0 }} />Настройки аккаунта</h3>
            <SlideButton label='Публичный профиль' value={data.can_be_public ? value : false} onChange={change} strict={true} disabled={!data.can_be_public} />
        </div>
    );
}

const Connections = ({ data, refetch }: { data: SettingsResponse, refetch(): void }) => {
    const [valid, setValid] = useState<boolean>(data.connections.minecraft?.valid);
    const [autoload, setAutoload] = useState<boolean>(data.connections?.minecraft?.autoload);

    const refresh = () => {
        const load_icon = document.getElementById('refresh');
        load_icon.style.animation = `${Style.loading} infinite 1s linear`;
        authApi.post("user/me/connections/minecraft/cache/purge").then((response) => {
            if (response.status === 200) {
                refetch();
                return;
            }
            alert(response.data.message);
        }).finally(() => {
            load_icon.style.animation = null;
        })
    }

    const disconnect = () => {
        const confirmed = confirm("Отвязать учётную запись Minecraft? Вы сможете в любое время привязать ее обратно.");
        if (confirmed) {
            authApi.delete('user/me/connections/minecraft').then((response) => {
                if (response.status === 200) {
                    refetch();
                    return;
                }
            })
        }
    }

    return (
        <div className={Style.container}>
            <h3><Image src="/static/icons/discord.svg" alt="" width={32} height={32} style={{ marginRight: ".4rem", borderRadius: 0 }} />Discord аккаунт</h3>
            <div className={Style.discord_container}>
                {data.connections?.discord &&
                    <Image src={data.connections?.discord.avatar + "?size=64"} alt="" width={64} height={64} style={{ borderRadius: "50%" }} className={Style.discord_avatar} />
                }
                <div className={Style.discord_name_container}>
                    <h1>{data.connections?.discord?.name}</h1>
                    <p className={fira.className}>{data.connections?.discord?.username}</p>
                </div>
            </div>
            <p style={{ margin: 0 }}>с {data.connections?.discord && formatDate(new Date(data.connections?.discord?.connected_at))}</p>

            <hr style={{ border: '1px var(--hr-color) solid', width: '100%' }} />

            <h3><Image src="/static/icons/block.svg" alt="" width={32} height={32} style={{ marginRight: ".4rem" }} />Minecraft аккаунт</h3>
            {!!data.connections?.minecraft ? <>
                <div className={Style.head_container}>
                    {data && <Image src={b64Prefix + data.connections?.minecraft.head} alt="" width={64} height={64} />}
                    <div className={Style.name_container}>
                        <p className={Style.name}>{data.connections?.minecraft.nickname}</p>
                        <p className={`${Style.uuid} ${fira.className}`}>{data.connections?.minecraft.uuid}</p>
                    </div>
                </div>
                <div className={Style.checkboxes}>
                    <SlideButton value={valid} strict={true} onChange={(val) => {
                        authApi.put('user/me/connections/minecraft/set_valid', {}, {
                            params: {
                                state: val
                            }
                        }).then((response) => {
                            if (response.status == 200) {
                                setValid((response.data as { new_data: boolean }).new_data);
                            }
                        })
                    }} label='Отображать ник в поиске' />
                    <SlideButton value={autoload} strict={true} onChange={(val) => {
                        authApi.put('user/me/connections/minecraft/set_autoload', {}, {
                            params: {
                                state: val
                            }
                        }).then((response) => {
                            if (response.status == 200) {
                                setAutoload((response.data as { new_data: boolean }).new_data);
                            }
                        })
                    }} label='Автоматически устанавливать скин в редакторе' />

                </div>
                <div className={Style.checkboxes}>
                    <span>Последний раз кэшировано {formatDate(new Date(data.connections?.minecraft?.last_cached))}</span>
                    <button className={Style.unlink} onClick={() => refresh()}>
                        <img alt="" src="/static/icons/refresh.svg" style={{ width: "1.5rem" }} id="refresh" />Обновить кэш
                    </button>

                    <button className={Style.unlink} onClick={() => disconnect()}>
                        <img alt="" src="/static/icons/plus.svg" style={{ width: "1.8rem", transform: "rotate(45deg)" }} />Отвязать
                    </button>
                </div>
            </> : <>
                <p style={{ margin: 0 }}>Привяжите свою учётную запись Minecraft к учетной записи PPLBandage для управления кешем скинов и настройками видимости
                    вашего никнейма в поиске.<br />Зайдите на Minecraft
                    сервер <span style={{ textDecoration: "underline", cursor: "pointer", fontWeight: "600" }} onClick={() => {
                        navigator.clipboard?.writeText("oauth.pplbandage.ru");
                    }
                    }>oauth.pplbandage.ru</span> (версия 1.8-текущая) и получите там 6-значный код.</p>

                <div>
                    <div className={Style.code_container}>
                        <input placeholder="Введите 6-значный код" type='number' id='code' className={Style.code_input} onChange={e => {
                            const target = document.getElementById('code') as HTMLInputElement;
                            if (target.value.length > 6) target.value = target.value.slice(0, 6)
                        }} />
                        <button className={Style.code_send} onClick={e => {
                            const target = document.getElementById('code') as HTMLInputElement;
                            if (target.value.length != 6) return;

                            authApi.post(`user/me/connections/minecraft/connect/${target.value}`).then((response) => {
                                if (response.status === 200) {
                                    refetch();
                                    return;
                                }

                                const data = response.data as { message_ru: string };
                                const err = document.getElementById('error') as HTMLParagraphElement;
                                err.innerHTML = data.message_ru;
                            })
                        }
                        }>Отправить</button>
                    </div>
                    <p style={{ margin: 0, color: "#dd0f0f", marginTop: "5px" }} id="error"></p>
                </div>
            </>}
        </div>

    );
}

const Themes = () => {
    const theme_default = getTheme('default');
    const theme_amoled = getTheme('amoled');
    const [themeState, setThemeState] = useState<string>(useCookie('theme_main') || 'default');
    const cookies = useCookies();

    const change_theme = (name: string) => {
        const theme: { [key: string]: string } = getTheme(name);
        cookies.set('theme_main', name, { expires: 365 * 10 });
        setThemeState(name);
        for (let prop in theme) {
            document.documentElement.style.setProperty(prop, theme[prop]);
        }
    }

    return (
        <div className={Style.container} style={{ paddingBottom: 'calc(1rem - 10px)' }}>
            <h3><Image src="/static/icons/scenery.svg" alt="" width={24} height={24} style={{ marginRight: ".4rem", borderRadius: 0 }} />Внешний вид</h3>
            <div className={Style_themes.parent}>
                <Theme data={{
                    name: 'default',
                    title: 'Default',
                    ...theme_default
                }}
                    theme={themeState}
                    onChange={change_theme}
                />
                <Theme data={{
                    name: 'amoled',
                    title: 'Amoled',
                    ...theme_amoled
                }}
                    theme={themeState}
                    onChange={change_theme}
                />
            </div>
        </div>
    );
}

interface ThemeProps {
    name: string,
    title: string,
    '--main-bg-color': string,
    '--main-card-color': string,
    '--main-element-color': string,
}

const Theme = ({ data, theme, onChange }: { data: ThemeProps, theme: string, onChange(val: string): void }) => {
    const change = (evt: ChangeEvent) => {
        const target = evt.target as HTMLInputElement;
        target.checked && onChange(data.name);
    }

    return (
        <div onClick={() => onChange(data.name)} style={{ cursor: 'pointer' }}>
            <div style={{ backgroundColor: data['--main-bg-color'] }} className={Style_themes.background}>
                <div style={{ backgroundColor: data['--main-card-color'] }} className={Style_themes.card}>
                    <div style={{ backgroundColor: data['--main-element-color'] }} className={Style_themes.icon} />
                    <div className={Style_themes.text_container}>
                        <div style={{ backgroundColor: data['--main-element-color'], width: '80%' }} />
                        <div style={{ backgroundColor: data['--main-element-color'] }} />
                    </div>
                </div>
            </div>
            <div className={Style_themes.footer}>
                <input type='radio' name='theme' id={data.name} checked={theme === data.name} onChange={change} />
                <label htmlFor={data.name}>{data.title}</label>
            </div>
        </div>
    )
}

export default Page;