import { describe, expect, it } from 'vitest';
import {
	appendCrop,
	clampCrop,
	cropOutputSize,
	cropQuality,
	defaultCrop,
	maxCropWidth,
	minCropWidth,
	panCrop,
	parseCrop,
	resizeCrop,
	zoomCrop
} from './crop';

const size = (width: number, height: number) => ({ width, height });

describe('defaultCrop', () => {
	it('keeps the whole of a 16:9 image', () => {
		expect(defaultCrop(size(960, 540))).toEqual({ x: 0, y: 0, width: 960, height: 540 });
		expect(defaultCrop(size(1920, 1080))).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
	});

	it('cuts a 4:3 image at the top and bottom, centred — what object-cover showed', () => {
		expect(defaultCrop(size(800, 600))).toEqual({ x: 0, y: 75, width: 800, height: 450 });
		expect(defaultCrop(size(640, 480))).toEqual({ x: 0, y: 60, width: 640, height: 360 });
	});

	it('cuts an ultra-wide image at the sides', () => {
		expect(defaultCrop(size(2560, 1080))).toEqual({ x: 320, y: 0, width: 1920, height: 1080 });
		expect(defaultCrop(size(960, 415))).toEqual({ x: 111, y: 0, width: 737, height: 415 });
	});

	it('never reaches outside an image that is one pixel off 16:9', () => {
		const crop = defaultCrop(size(960, 539));
		expect(crop.y + crop.height).toBeLessThanOrEqual(539);
		expect(crop.x + crop.width).toBeLessThanOrEqual(960);
	});
});

describe('minimum size', () => {
	it('is 640 px across when the image can hold it', () => {
		expect(minCropWidth(size(1920, 1080))).toBe(640);
		expect(minCropWidth(size(800, 600))).toBe(640);
	});

	it('is the whole largest 16:9 area when the image is too small for 640', () => {
		expect(maxCropWidth(size(320, 240))).toBe(320);
		expect(minCropWidth(size(320, 240))).toBe(320);
		expect(minCropWidth(size(600, 337))).toBe(599);
	});

	it('locks a too-small image at its default: zoom does nothing, pan still works', () => {
		const source = size(320, 240);
		const start = defaultCrop(source);
		expect(zoomCrop(start, 4, source)).toEqual(start);
		expect(panCrop(start, 0, -1000, source)).toEqual({ ...start, y: 0 });
	});
});

describe('clampCrop', () => {
	const source = size(1920, 1080);

	it('rounds to whole pixels and derives the height from the width', () => {
		expect(clampCrop({ x: 10.4, y: 20.6, width: 1000.2 }, source)).toEqual({
			x: 10,
			y: 21,
			width: 1000,
			height: 563
		});
	});

	it('keeps the width between the minimum and the largest area', () => {
		expect(clampCrop({ x: 0, y: 0, width: 100 }, source).width).toBe(640);
		expect(clampCrop({ x: 0, y: 0, width: 5000 }, source).width).toBe(1920);
	});

	it('pushes the area back inside the image', () => {
		expect(clampCrop({ x: -50, y: 2000, width: 640 }, source)).toEqual({
			x: 0,
			y: 720,
			width: 640,
			height: 360
		});
		expect(clampCrop({ x: 1900, y: -1, width: 640 }, source).x).toBe(1280);
	});
});

describe('zoomCrop', () => {
	const source = size(1920, 1080);
	const full = defaultCrop(source);

	it('zooms in around the centre by default', () => {
		expect(zoomCrop(full, 2, source)).toEqual({ x: 480, y: 270, width: 960, height: 540 });
	});

	it('keeps the anchor point in place', () => {
		const zoomed = zoomCrop(full, 2, source, { x: 0, y: 0 });
		expect(zoomed).toEqual({ x: 0, y: 0, width: 960, height: 540 });
		const corner = zoomCrop(full, 2, source, { x: 1, y: 1 });
		expect(corner.x + corner.width).toBe(1920);
		expect(corner.y + corner.height).toBe(1080);
	});

	it('stops at the minimum and at the whole image', () => {
		expect(zoomCrop(full, 100, source).width).toBe(640);
		expect(zoomCrop(zoomCrop(full, 2, source), 0.01, source)).toEqual(full);
	});

	it('resizes around the centre for the slider', () => {
		expect(resizeCrop(full, 960, source)).toEqual({ x: 480, y: 270, width: 960, height: 540 });
	});
});

describe('cropOutputSize', () => {
	it('keeps a crop that fits within 1600 px as it is — never scaled up', () => {
		expect(cropOutputSize({ x: 0, y: 0, width: 640, height: 360 })).toEqual(size(640, 360));
		expect(cropOutputSize({ x: 0, y: 0, width: 1600, height: 900 })).toEqual(size(1600, 900));
		expect(cropOutputSize({ x: 0, y: 0, width: 320, height: 180 })).toEqual(size(320, 180));
	});

	it('scales a larger crop down to at most 1600×900', () => {
		expect(cropOutputSize({ x: 0, y: 0, width: 1920, height: 1080 })).toEqual(size(1600, 900));
		expect(cropOutputSize({ x: 0, y: 0, width: 3840, height: 2160 })).toEqual(size(1600, 900));
	});

	it('keeps the aspect of an uncropped image', () => {
		expect(cropOutputSize({ x: 0, y: 0, width: 2000, height: 1500 })).toEqual(size(1600, 1200));
	});
});

describe('cropQuality', () => {
	it('warns below 960 and flags anything under the 640 minimum', () => {
		expect(cropQuality({ x: 0, y: 0, width: 960, height: 540 })).toBe('ok');
		expect(cropQuality({ x: 0, y: 0, width: 959, height: 539 })).toBe('soft');
		expect(cropQuality({ x: 0, y: 0, width: 640, height: 360 })).toBe('soft');
		expect(cropQuality({ x: 0, y: 0, width: 320, height: 180 })).toBe('tooSmall');
	});
});

describe('parseCrop', () => {
	function form(fields: Record<string, string>): FormData {
		const data = new FormData();
		for (const [key, value] of Object.entries(fields)) data.set(key, value);
		return data;
	}

	const valid = {
		cropX: '100',
		cropY: '50',
		cropWidth: '640',
		cropHeight: '360',
		sourceWidth: '1920',
		sourceHeight: '1080'
	};

	it('accepts what the tool produces', () => {
		expect(parseCrop(form(valid))).toEqual({ x: 100, y: 50, width: 640, height: 360 });
	});

	it('round-trips through appendCrop', () => {
		const data = new FormData();
		const source = size(800, 600);
		appendCrop(data, { crop: defaultCrop(source), source });
		expect(parseCrop(data)).toEqual(defaultCrop(source));
	});

	it('returns null when no crop was sent at all', () => {
		expect(parseCrop(form({}))).toBeNull();
		expect(parseCrop(form({ ...valid, cropX: '' }))).toBeNull();
	});

	it('drops anything that is not plain whole pixels', () => {
		for (const bad of ['-1', '1.5', '1e3', ' 10', 'abc', '0x10', '1234567']) {
			expect(parseCrop(form({ ...valid, cropX: bad }))).toBeNull();
		}
	});

	it('drops a rectangle that reaches outside the source', () => {
		expect(parseCrop(form({ ...valid, cropX: '1281' }))).toBeNull();
		expect(parseCrop(form({ ...valid, cropY: '721' }))).toBeNull();
		expect(parseCrop(form({ ...valid, cropX: '1280', cropY: '720' }))).not.toBeNull();
	});

	it('drops a rectangle that is not 16:9 within a pixel', () => {
		expect(parseCrop(form({ ...valid, cropHeight: '361' }))).not.toBeNull();
		expect(parseCrop(form({ ...valid, cropHeight: '362' }))).toBeNull();
		expect(parseCrop(form({ ...valid, cropHeight: '480' }))).toBeNull();
	});

	it('drops a crop below the minimum, unless the source cannot hold the minimum', () => {
		expect(parseCrop(form({ ...valid, cropWidth: '320', cropHeight: '180' }))).toBeNull();
		expect(
			parseCrop(
				form({
					cropX: '0',
					cropY: '30',
					cropWidth: '320',
					cropHeight: '180',
					sourceWidth: '320',
					sourceHeight: '240'
				})
			)
		).toEqual({ x: 0, y: 30, width: 320, height: 180 });
	});

	it('drops an empty or absurd source size', () => {
		expect(parseCrop(form({ ...valid, sourceWidth: '0' }))).toBeNull();
		expect(parseCrop(form({ ...valid, sourceWidth: '99999' }))).toBeNull();
	});
});
