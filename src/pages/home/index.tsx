// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React from "react";
import { useEffect } from "react";
import "./index.css";

import i18n from "i18next";
import { rendererInit } from '../../i18n/config'

rendererInit()

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// Access the plugins facade through window.plugins
// as set up in preload.js

import { setup, plugins, extensionPoints, activationPoints } from 'pluggable-electron/renderer'

// Set Pluggable Electron up in the renderer
async function setupPE() {
    // Enable activation point management
    setup({ importer: (pluginPath) => import(pluginPath) })

    // Register all active plugins with their activation points
    await plugins.registerActive()

}
setupPE()


declare const window: Window &
    typeof globalThis & {
        electron: any,
    }


// // Uninstall a plugin on clicking uninstall
// document.getElementById('uninstall-plg').addEventListener('submit', async (e) => {
//     e.preventDefault()
//     const pluginPkg = new FormData(e.target).get('plugin-pkg')

//     // Send the filename of the to be uninstalled plugin
//     // to the main process for removal
//     const res = await plugins.uninstall([pluginPkg])
//     console.log(res ? 'Plugin successfully uninstalled' : 'Plugin could not be uninstalled')
// })

// // Update all plugins on clicking update plugins
// document.getElementById('update-plgs').addEventListener('click', async (e) => {
//     const active = await plugins.getActive()
//     plugins.update(active.map(plg => plg.name))
//     console.log('Plugins updated')
// })

// // Trigger the init activation point on clicking activate plugins
// document.getElementById('activate-plgs').addEventListener('click', async (e) => {
//     // Trigger activation point
//     activationPoints.trigger('init')

//     // Enable extend functionality now that extensions have been registered
//     const buttons = document.getElementsByClassName('extend')
//     for (const btn of buttons) {
//         btn.disabled = false
//     }
//     console.log('"Init" activation point triggered')
// })

// // Create a menu that can be extended through plugins
// document.getElementById('extend-menu').addEventListener('click', async (e) => {
//     // Get additional menu items from plugins, providing the desired parent item
//     const menuItems = await Promise.all(extensionPoints.execute('extend-menu', 'demo-parent-li'))
//     // Insert items based on the parent and text provide by the plugin
//     menuItems.forEach(item => {
//         const demoAnchor = document.createElement('a')
//         demoAnchor.classList.add('nav-link')
//         demoAnchor.href = '#'
//         demoAnchor.innerText = item.text

//         const demoLi = document.createElement('li')
//         demoLi.appendChild(demoAnchor)

//         const parentId = item.hasOwnProperty('parent') ? item.parent : 'demo-menu'
//         document.getElementById(parentId).appendChild(demoLi)
//     })
// })

// // Calculate a cost based on plugin extensions
// document.getElementById('calc-price').addEventListener('submit', async (e) => {
//     e.preventDefault()
//     const price = new FormData(e.target).get('price')
//     // Get the cost, calculated in multiple steps, by the plugins
//     const cost = await extensionPoints.executeSerial('calc-price', price)
//     // Display result in the app
//     document.getElementById('demo-cost').innerText = cost
// })

// // Provide image url to plugins to display as desired
// document.getElementById('display-img').addEventListener('submit', async (e) => {
//     e.preventDefault()
//     const img = new FormData(e.target).get('img-url')
//     // Provide image url to plugins
//     extensionPoints.execute('display-img', img)
// })


export const App = () => {
    useEffect(() => {
        //   let backFn: any = backgroundHandle();
        return () => {
            // if (backFn) {
            //   backFn();
            // }
        };
    }, []);

    return (
        <div>

            <h2  >{i18n.t('Manage plugin lifecycle')}</h2>
            {/* <label  >Package file:
                    <input type="file" name="plugin-file" />
                </label> */}

            {/* Install a new plugin on clicking the install button */}
            <button onClick={
                async (e) => {
                    e.preventDefault()
                    const pluginFiles = window.electron.openInstallFile()
                    if (pluginFiles) {
                        console.log(pluginFiles)
                        const installed = await plugins.install(pluginFiles)
                        console.log('Installed plugin:', installed)
                    }

                }}>Install</button>

            <button onClick={async (e) => {
                e.preventDefault();
                const active = await plugins.getActive()
                plugins.update(active.map(plg => plg.name))
                console.log('Plugins updated');


            }}>
                updated
            </button>

            <button onClick={async(e) => {
                e.preventDefault();
                await activationPoints.trigger('init');
                extensionPoints.execute('extend-menu', 'newItem')
            }}>run</button>

<button onClick={(e)=>{
    e.preventDefault();
  
}}>f</button>

        </div>
    );
};


// 严格模式，会在开发环境重复调用2次
createRoot(document.getElementById("root") as Element).render(
    // <StrictMode>
    // </StrictMode>
    <App />
);