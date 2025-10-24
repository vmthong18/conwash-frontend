/** @type {import('tailwindcss').Config} */
module.exports = {
  	"content": [
    		"./pages/**/*.{js,ts,jsx,tsx}",
    		"./components/**/*.{js,ts,jsx,tsx}"
  	],
  	"theme": {
    		"extend": {
      			"colors": {
        				"whitesmoke": "#f2f4f7",
        				"lavender": "#e7eefc",
        				"white": "#fff",
        				"gray": {
          					"100": "#7a7c80",
          					"200": "#141414",
          					"300": "rgba(0, 0, 0, 0.2)"
        				},
        				"royalblue": "#1059e0",
        				"lightgray": "#d3d5db",
        				"silver": "#c4c6cc",
        				"darkslategray": "#333",
        				"dimgray": "#666",
        				"darkgray": "#999",
        				"black": "#000"
      			},
      			"spacing": {
        				"num-292": "292px",
        				"num-156": "156px"
      			},
      			"fontFamily": {
        				"roboto": "Roboto",
        				"inter": "Inter",
        				"sf-pro-text": "SF Pro Text"
      			},
      			"borderRadius": {
        				"num-8": "8px",
        				"num-12": "12px"
      			},
      			"padding": {
        				"num-4": "4px",
        				"num-0": "0px"
      			}
    		},
    		"fontSize": {
      			"num-14": "14px",
      			"num-16": "16px"
    		},
    		"lineHeight": {
      			"num-20": "20px",
      			"num-24": "24px"
    		}
  	},
  	"corePlugins": {
    		"preflight": false
  	}
}