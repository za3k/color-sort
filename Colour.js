/**
 * Colour class
 * Represet the colour object and it's different types (HEX, RGBA, XYZ, LAB)
 * This class have the ability to do the following
 * 1. Convert HEX to RGBA
 * 2. Convert RGB to XYZ
 * 3. Convert XYZ to LAB
 * 4. Calculate Delta E00 between two LAB colour (Main purpose)
 * @author Ahmed Moussa <moussa.ahmed95@gmail.com>
 * @version 2.0
 */
 class Colour {
	/**
	 * Convert RGB to XYZ
	 * @param {[Number]} r     Red value from 0 to 255
	 * @param {[Number]} g     Green value from 0 to 255
	 * @param {[Number]} b     Blue value from 0 to 255
	 * @param {Number} [a=1]   Obacity value from 0 to 1 with a default value of 1 if not sent
	 */
	static rgb2xyz(rgba) {
        var r = rgba.r, g = rgba.g, b = rgba.b
        var a = (typeof(rgba.a) == "undefined") ? 1 : rgba.a

		if (r > 255) {
			// console.warn("Red value was higher than 255. It has been set to 255.");
			r = 255;
		} else if (r < 0) {
			// console.warn("Red value was smaller than 0. It has been set to 0.");
			r = 0;
		}
		if (g > 255) {
			// console.warn("Green value was higher than 255. It has been set to 255.");
			g = 255;
		} else if (g < 0) {
			// console.warn("Green value was smaller than 0. It has been set to 0.");
			g = 0;
		}
		if (b > 255) {
			// console.warn("Blue value was higher than 255. It has been set to 255.");
			b = 255;
		} else if (b < 0) {
			// console.warn("Blue value was smaller than 0. It has been set to 0.");
			b = 0;
		}
		if (a > 1) {
			// console.warn("Obacity value was higher than 1. It has been set to 1.");
			a = 1;
		} else if (a < 0) {
			// console.warn("Obacity value was smaller than 0. It has been set to 0.");
			a = 0;
		}
		r = r / 255;
		g = g / 255;
		b = b / 255;
		// step 1
		if (r > 0.04045) {
			r = Math.pow(((r + 0.055) / 1.055), 2.4);
		} else {
			r = r / 12.92;
		}
		if (g > 0.04045) {
			g = Math.pow(((g + 0.055) / 1.055), 2.4);
		} else {
			g = g / 12.92;
		}
		if (b > 0.04045) {
			b = Math.pow(((b + 0.055) / 1.055), 2.4);
		} else {
			b = b / 12.92;
		}
		// step 2
		r = r * 100;
		g = g * 100;
		b = b * 100;
		// step 3
		const x = (r * 0.4124564) + (g * 0.3575761) + (b * 0.1804375);
		const y = (r * 0.2126729) + (g * 0.7151522) + (b * 0.0721750);
		const z = (r * 0.0193339) + (g * 0.1191920) + (b * 0.9503041);
		return {x, y, z};
	}
	/**
	 * Convert XYZ to LAB
	 * @param {[Number]} x Value
	 * @param {[Number]} y Value
	 * @param {[Number]} z Value
	 */
	static xyz2lab(xyz) {
		// using 10o Observer (CIE 1964)
		// CIE10_D65 = {94.811f, 100f, 107.304f} => Daylight
		const referenceX = 94.811;
		const referenceY = 100;
		const referenceZ = 107.304;
		// step 1
		var x = xyz.x / referenceX;
		var y = xyz.y / referenceY;
		var z = xyz.z / referenceZ;
		// step 2
		if (x > 0.008856) {
			x = Math.pow(x, (1 / 3));
		} else {
			x = (7.787 * x) + (16 / 116);
		}
		if (y > 0.008856) {
			y = Math.pow(y, (1 / 3));
		} else {
			y = (7.787 * y) + (16 / 116);
		}
		if (z > 0.008856) {
			z = Math.pow(z, (1 / 3));
		} else {
			z = (7.787 * z) + (16 / 116);
		}
		// step 3
		const l = (116 * y) - 16;
		const a = 500 * (x - y);
		const b = 200 * (y - z);
		return {l, a, b};
	}
	/**
	 * The difference between two given colours with respect to the human eye
	 * @param {[type]} l1 Colour 1
	 * @param {[type]} a1 Colour 1
	 * @param {[type]} b1 Colour 1
	 * @param {[type]} l2 Colour 2
	 * @param {[type]} a2 Colour 2
	 * @param {[type]} b2 Colour 2
	 */
	static deltaE00Lab(lab1, lab2) {
        const l1 = lab1.l, a1 = lab1.a, b1 = lab1.b,
              l2 = lab2.l, a2 = lab2.a, b2 = lab2.b;
		// Utility functions added to Math Object
		Math.rad2deg = function(rad) {
			return 360 * rad / (2 * Math.PI);
		};
		Math.deg2rad = function(deg) {
			return (2 * Math.PI * deg) / 360;
		};
		// Start Equation
		// Equation exist on the following URL http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE2000.html
		const avgL = (l1 + l2) / 2;
		const c1 = Math.sqrt(Math.pow(a1, 2) + Math.pow(b1, 2));
		const c2 = Math.sqrt(Math.pow(a2, 2) + Math.pow(b2, 2));
		const avgC = (c1 + c2) / 2;
		const g = (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7)))) / 2;

		const a1p = a1 * (1 + g);
		const a2p = a2 * (1 + g);

		const c1p = Math.sqrt(Math.pow(a1p, 2) + Math.pow(b1, 2));
		const c2p = Math.sqrt(Math.pow(a2p, 2) + Math.pow(b2, 2));

		const avgCp = (c1p + c2p) / 2;

		let h1p = Math.rad2deg(Math.atan2(b1, a1p));
		if (h1p < 0) {
			h1p = h1p + 360;
		}

		let h2p = Math.rad2deg(Math.atan2(b2, a2p));
		if (h2p < 0) {
			h2p = h2p + 360;
		}

		const avghp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;

		const t = 1 - 0.17 * Math.cos(Math.deg2rad(avghp - 30)) + 0.24 * Math.cos(Math.deg2rad(2 * avghp)) + 0.32 * Math.cos(Math.deg2rad(3 * avghp + 6)) - 0.2 * Math.cos(Math.deg2rad(4 * avghp - 63));

		let deltahp = h2p - h1p;
		if (Math.abs(deltahp) > 180) {
			if (h2p <= h1p) {
				deltahp += 360;
			} else {
				deltahp -= 360;
			}
		}

		const deltalp = l2 - l1;
		const deltacp = c2p - c1p;

		deltahp = 2 * Math.sqrt(c1p * c2p) * Math.sin(Math.deg2rad(deltahp) / 2);

		const sl = 1 + ((0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2)));
		const sc = 1 + 0.045 * avgCp;
		const sh = 1 + 0.015 * avgCp * t;

		const deltaro = 30 * Math.exp(-(Math.pow((avghp - 275) / 25, 2)));
		const rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
		const rt = -rc * Math.sin(2 * Math.deg2rad(deltaro));

		const kl = 1;
		const kc = 1;
		const kh = 1;

		const deltaE = Math.sqrt(Math.pow(deltalp / (kl * sl), 2) + Math.pow(deltacp / (kc * sc), 2) + Math.pow(deltahp / (kh * sh), 2) + rt * (deltacp / (kc * sc)) * (deltahp / (kh * sh)));

		return deltaE;
	}

    // Taken from https://gist.github.com/avisek/eadfbe7a7a169b1001a2d3affc21052e
    static hsl2rgb(hsl) {
        const h = hsl.h / 360
        const s = hsl.s / 100
        const l = hsl.l / 100

        let r, g, b

        if (s == 0) {
            r = g = b = l // achromatic
        } else {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1
                if (t > 1) t -= 1
                if (t < 1/6) return p + (q - p) * 6 * t
                if (t < 1/2) return q
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
                return p
            }

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s
            const p = 2 * l - q

            r = hue2rgb(p, q, h + 1/3)
            g = hue2rgb(p, q, h)
            b = hue2rgb(p, q, h - 1/3)
        }

        r *= 255
        g *= 255
        b *= 255

        return { r, g, b}
    }

    static hsl2lab(hsl) {
        const rgb = Colour.hsl2rgb(hsl)
        const xyz = Colour.rgb2xyz(rgb) 
        const lab = Colour.xyz2lab(xyz)
        return lab
    }

    static deltaE00(hsl1, hsl2) {
        return Colour.deltaE00Lab(Colour.hsl2lab(hsl1), Colour.hsl2lab(hsl2))
    }
}
