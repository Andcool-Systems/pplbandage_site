"use client";

import React, { use } from 'react';
import { useEffect, useState, useRef } from 'react';
import { authApi } from "@/app/api.module";
import { useRouter } from "next/navigation";
import Style from "../../styles/me/connections.module.css";
import Header from "../../modules/header.module";
import useCookie from '../../modules/useCookie.module';
import { Cookies, useCookies } from 'next-client-cookies';
import {
    QueryClient,
    QueryClientProvider,
    useQuery,
  } from "@tanstack/react-query";
import Image from 'next/image';
import { Me } from '@/app/modules/me.module';
import { Fira_Code } from "next/font/google";
const fira = Fira_Code({ subsets: ["latin"] });

const queryClient = new QueryClient();

export default function Home() {
    return (
        <QueryClientProvider client={queryClient}>
            <Main/>
        </QueryClientProvider>
    );
}

interface ConnectionResponse {
    statusCode: number,
    minecraft?: {
        nickname: string,
        uuid: string,
        expires_at: number,
        head: string,
        valid: boolean
    }
}

const b64Prefix = "data:image/png;base64,";

const Main = () => {
    const router = useRouter();
    const cookies = useRef<Cookies>(useCookies());
    const logged = useCookie('sessionId');
    const [isLogged, setIsLogged] = useState<boolean>(cookies.current.get('sessionId') != undefined);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [connected, setConnected] = useState<boolean>(false);

    const [valid, setValid] = useState<boolean>(false);

    const { data, refetch } = useQuery({
        queryKey: ["userConnections"],
        retry: false,
        queryFn: async () => {
            const res = await authApi.get("users/me/connections", {withCredentials: true, validateStatus: () => true});
            const data = res.data as ConnectionResponse;
            setConnected(data.minecraft !== null);
            setLoaded(true);
            setValid(data?.minecraft.valid);
            return data;
            
        },
    });

    useEffect(() => {
        if (!isLogged) {
            router.replace('/me');
        }
        setIsLogged(logged != undefined);
    }, [logged]);

    return (
    <body style={{backgroundColor: "#17181C", margin: 0}}>
        <Header/>
        {isLogged &&
            <Me>
                <div className={Style.container} style={loaded ? {opacity: "1", transform: "translateY(0)"} : {opacity: "0", transform: "translateY(50px)"}}>
                    <h3><Image src="/static/icons/block.svg" alt="" width={32} height={32} style={{marginRight: ".4rem"}}/>Minecraft аккаунт</h3>
                    {connected ? <>
                        <div className={Style.head_container}>
                            {data && <Image src={b64Prefix + data?.minecraft.head} alt="" width={64} height={64} />}
                            <div className={Style.name_container}>
                                <p className={Style.name}>{data?.minecraft.nickname}</p>
                                <p className={`${Style.uuid} ${fira.className}`}>{data?.minecraft.uuid}</p>
                            </div>
                        </div>
                        <div className={Style.checkboxes}>
                            <div>
                                <input type='checkbox' id="valid" checked={valid} onChange={() => {
                                    const el = document.getElementById('valid') as HTMLInputElement;
                                    authApi.put('users/me/connections/minecraft/set_valid', {}, {params: {
                                        state: el.checked
                                    }}).then((response) => {
                                        if (response.status == 200){
                                            setValid((response.data as {new_data: boolean}).new_data);
                                        }
                                    })
                                }}/>
                                <label htmlFor="valid" style={{userSelect: "none"}}>Отображать ник в поиске</label>
                            </div>
                            <div>
                                <input type='checkbox' id="auto_connect" />
                                <label htmlFor="auto_connect" style={{userSelect: "none"}}>Автоматически устанавливать скин в редакторе</label>
                            </div>
                        </div>
                        <button className={Style.unlink} onClick={() => {
                            const confirmed = confirm("Отвязать учётную запись Minecraft? Вы сможете в любое время привязать ее обратно.");
                            if (confirmed) {
                                authApi.delete('users/me/connections/minecraft/disconnect').then((response) => {
                                    if (response.status === 200) {
                                        refetch();
                                        return;
                                    }
                                })
                            }
                        }}><img src="/static/icons/plus.svg" style={{width: "1.8rem", transform: "rotate(45deg)"}}/>Отвязать</button>
                    </> : <>
                        <p style={{margin: 0}}>Привяжите свою учётную запись Minecraft к учетной записи PPLBandage для управления кешем скинов и настройками видимости 
                            вашего никнейма в поиске.<br/>Зайдите на Minecraft
                             сервер <span style={{textDecoration: "underline", cursor: "pointer", fontWeight: "600"}} onClick={() => {
                                navigator.clipboard?.writeText("oauth.pplbandage.ru");
                                }
                            }>oauth.pplbandage.ru</span> (версия 1.8-текущая) и получите там 6-значный код.</p>

                        <div>
                            <div className={Style.code_container}>
                                <input placeholder="Введите 6-значный код"type='number' id='code' className={Style.code_input} onChange={e => {
                                    const target = document.getElementById('code') as HTMLInputElement;
                                    if (target.value.length > 6) target.value = target.value.slice(0, 6)}}/>
                                <button className={Style.code_send} onClick={e => {
                                        const target = document.getElementById('code') as HTMLInputElement;
                                        if (target.value.length != 6) return;

                                        authApi.post(`users/me/connections/minecraft/connect/${target.value}`).then((response) => {
                                            if (response.status === 200) {
                                                refetch();
                                                return;
                                            }

                                            const data = response.data as {message_ru: string};
                                            const err = document.getElementById('error') as HTMLParagraphElement;
                                            err.innerHTML = data.message_ru;
                                        })
                                    }
                                }>Отправить</button>
                            </div>
                            <p style={{margin: 0, color: "#dd0f0f", marginTop: "5px"}} id="error"></p>
                        </div>
                    </>}
                </div>
            </Me>
        }
    </body>
    );
}