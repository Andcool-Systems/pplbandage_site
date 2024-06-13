"use client";

import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { authApi } from "@/app/api.module";
import { useRouter } from "next/navigation";
import styles from "../styles/me/me.module.css";
import { Tooltip } from '../modules/tooltip';
import Header from "../modules/header.module";
import useCookie from '../modules/useCookie.module';
import { Cookies, useCookies } from 'next-client-cookies';
import style_sidebar from "../styles/me/sidebar.module.css";
import {
    QueryClient,
    QueryClientProvider,
    useQuery,
  } from "@tanstack/react-query";
import { Bandage } from '@/app/interfaces';
import { SkinViewer } from 'skinview3d';
import { Card, generateSkin } from '@/app/modules/card.module';
import { Me } from '@/app/modules/me.module';
import Link from 'next/link';

const roles = [
    {
        id: 1142141232685006990,
        title: "Игрок PepeLand 8",
        color: 3003583
    },
    {   
        id: 958432771519422476,
        title: "Игрок PepeLand 7",
        color: 3003583
    },
    {
        id: 495989709265436687,
        title: "Twitch Subs",
        color: 6333946
    },
    {
        id: 589530176501579780,
        title: "Discord Server Booster",
        color: 15235577
    },
    {
        id: 987234058478186506,
        title: "Бусти",
        color: 15105570
    }
];
const queryClient = new QueryClient();

export default function Home() {
    

    return (
        <QueryClientProvider client={queryClient}>
            <Main/>
        </QueryClientProvider>
    );
}


const Main = () => {
    const router = useRouter();
    const cookies = useRef<Cookies>(useCookies());
    const logged = useCookie('sessionId');
    const [isLogged, setIsLogged] = useState<boolean>(cookies.current.get('sessionId') != undefined);

    const [elements, setElements] = useState<JSX.Element[]>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["userWorks"],
        retry: 5,
        queryFn: async () => {
            const res = await authApi.get("users/me/works", {withCredentials: true});
            return res.data as Bandage[] || undefined;
  
        },
    });

    useEffect(() => {
        if (data) {
            const skinViewer = new SkinViewer({
                width: 300,
                height: 300,
                renderPaused: true
            });
            skinViewer.camera.rotation.x = -0.4;
            skinViewer.camera.rotation.y = 0.8;
            skinViewer.camera.rotation.z = 0.29;
            skinViewer.camera.position.x = 17;
            skinViewer.camera.position.y = 6.5;
            skinViewer.camera.position.z = 11;
            skinViewer.loadBackground("/static/background.png").then(() => {

                Promise.all(data.map(async (el) => {
                    try {
                    const result = await generateSkin(el.base64, Object.values(el.categories).some(val => val.id == 3))
                    await skinViewer.loadSkin(result);
                    skinViewer.render();
                    const image = skinViewer.canvas.toDataURL();
                    return <Card el={el} base64={image} key={el.id}/>
                    } catch {
                        return;
                    }
                }))
                .then(results => setElements(results))
                .catch(error => console.error('Error generating skins', error))
                .finally(() => skinViewer.dispose());
            });
        }
    }, [data]);

    useEffect(() => {
        setIsLogged(logged != undefined);
    }, [logged])

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            authApi.get(`oauth/discord/${code}`).then((response) => {
                if (response.status == 403) {
                    const about_logining = document.getElementById('about_logining');
                    about_logining.style.color = "#ff2a2a";
                    about_logining.style.textDecoration = "underline";
                    about_logining.style.animation = `${styles.attention} 4s ease-in-out 0s 0.5`;
                }
            })
            router.replace('/me');
        }
        return () => {}
    }, [])

    return (
    <body style={{backgroundColor: "#17181C", margin: 0}}>
        <Header/>
        {!isLogged ? <Login/> : 
            <Me>
                <div style={elements ? {opacity: "1", transform: "translateY(0)"} : {opacity: "0", transform: "translateY(50px)"}} className={styles.cont}>
                    <div style={{display: "flex", flexDirection: "column", alignItems: "stretch"}}>  
                        <Link className={styles.create} href="/workshop/create"><img src="/static/icons/plus.svg" />Создать</Link>
                        <div className={style_sidebar.skins_container}>
                            {elements}
                        </div>
                    </div>
                </div>
            </Me>
        }
    </body>
    );
}


const Login = () => {
    const dat = roles.map((role) => {
        return(<div key={role.id} className={styles.role_container}>
            <span style={{backgroundColor: "#" + role.color.toString(16)}} className={styles.role_dot}>
            </span>
            <span className={styles.role_title}>{role.title}</span>
        </div>)
    })

    return (
        <main className={styles.login_main}>
            <div className={styles.login_container}>
                <h1>Войти через</h1>
                <a className={styles.login_button} href='https://discord.com/oauth2/authorize?client_id=1248263705033048094&response_type=code&redirect_uri=http%3A%2F%2F192.168.0.53%2Fme&scope=identify'>
                    <img src="/static/icons/discord.svg" />
                    Discord
                </a>

                <span className={styles.p} id="about_logining">Для регистрации вам нужно быть членом Discord сервера <a href='https://baad.pw/ds' className={styles.a}>Pwgood</a> и иметь одну из этих <Tooltip 
                    parent_id="about_logining"
                    body={
                    <div className={styles.roles_container}>
                        {dat}
                    </div>} timeout={0} className={styles.roles_text_container}>
                        <span className={styles.roles_text}> ролей</span>
                    </Tooltip>
                </span>

                <p style={{color: "gray", marginBottom: 0}}>Регистрируясь на сайте вы соглашаетесь с настоящими <a className={styles.a} href="/tos" style={{color: "gray"}}>условиями пользования</a></p>
            </div>
        </main>
    );
}