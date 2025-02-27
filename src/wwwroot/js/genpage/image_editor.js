
/**
 * Base class for an image editor tool, such as Paintbrush or the General tool.
 */
class ImageEditorTool {
    constructor(editor, id, icon, name, description) {
        this.editor = editor;
        this.id = id;
        this.icon = icon;
        this.iconImg = new Image();
        this.iconImg.src = `/imgs/${icon}.png`;
        this.name = name;
        this.description = description;
        this.active = false;
        this.cursor = 'crosshair';
        this.makeDivs();
    }

    makeDivs() {
        this.infoBubble = createDiv(null, 'sui-popover');
        this.infoBubble.innerHTML = `<div class="image-editor-info-bubble-title">${escapeHtml(this.name)}</div><div class="image-editor-info-bubble-description">${escapeHtml(this.description)}</div>`;
        this.div = document.createElement('div');
        this.div.className = 'image-editor-tool';
        this.div.style.backgroundImage = `url(/imgs/${this.icon}.png)`;
        this.div.addEventListener('click', () => this.onClick());
        this.div.addEventListener('mouseenter', () => {
            this.infoBubble.style.top = `${this.div.offsetTop}px`;
            this.infoBubble.style.left = `${this.div.offsetLeft + this.div.clientWidth + 5}px`;
            this.infoBubble.classList.add('sui-popover-visible');
        });
        this.div.addEventListener('mouseleave', () => {
            this.infoBubble.classList.remove('sui-popover-visible');
        });
        this.editor.leftBar.appendChild(this.infoBubble);
        this.editor.leftBar.appendChild(this.div);
        this.configDiv = document.createElement('div');
        this.configDiv.className = 'image-editor-tool-bottombar';
        this.configDiv.style.display = 'none';
        this.editor.bottomBar.appendChild(this.configDiv);
    }

    onClick() {
        this.editor.activateTool(this.id);
    }

    setActive() {
        if (this.active) {
            return;
        }
        this.active = true;
        this.div.classList.add('image-editor-tool-selected');
        this.configDiv.style.display = 'flex';
    }

    setInactive() {
        if (!this.active) {
            return;
        }
        this.active = false;
        this.div.classList.remove('image-editor-tool-selected');
        this.configDiv.style.display = 'none';
    }

    draw() {
    }

    drawCircleBrush(x, y, radius) {
        this.editor.ctx.strokeStyle = '#ffffff';
        this.editor.ctx.lineWidth = 1;
        this.editor.ctx.globalCompositeOperation = 'difference';
        this.editor.ctx.beginPath();
        this.editor.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.editor.ctx.stroke();
        this.editor.ctx.globalCompositeOperation = 'source-over';
    }

    onMouseDown(e) {
    }

    onMouseUp(e) {
    }

    onMouseMove(e) {
    }

    onMouseWheel(e) {
    }

    onGlobalMouseMove(e) {
        return false;
    }

    onGlobalMouseUp(e) {
        return false;
    }
}

/**
 * The generic common tool (can be activated freely with the Alt key).
 */
class ImageEditorToolGeneral extends ImageEditorTool {
    constructor(editor) {
        super(editor, 'general', 'mouse', 'General', 'General tool. Lets you move around the canvas, or adjust size of current layer.\nWhile resizing an object, hold CTRL to snap-to-grid, or hold SHIFT to disable aspect preservation.\nThe general tool can be activated at any time with the Alt key.');
        this.currentDragCircle = null;
        this.rotateIcon = new Image();
        this.rotateIcon.src = '/imgs/rotate.png';
        this.moveIcon = new Image();
        this.moveIcon.src = '/imgs/move.png';
    }

    fixCursor() {
        this.cursor = this.editor.mouseDown ? 'grabbing' : 'crosshair';
    }

    activeLayerControlCircles() {
        let [offsetX, offsetY] = this.editor.imageCoordToCanvasCoord(this.editor.activeLayer.offsetX, this.editor.activeLayer.offsetY);
        let [width, height] = [this.editor.activeLayer.width * this.editor.zoomLevel, this.editor.activeLayer.height * this.editor.zoomLevel];
        let circles = [];
        let radius = 4;
        circles.push({name: 'top-left', radius: radius, x: offsetX - radius / 2, y: offsetY - radius / 2});
        circles.push({name: 'top-right', radius: radius, x: offsetX + width + radius / 2, y: offsetY - radius / 2});
        circles.push({name: 'bottom-left', radius: radius, x: offsetX - radius / 2, y: offsetY + height + radius / 2});
        circles.push({name: 'bottom-right', radius: radius, x: offsetX + width + radius / 2, y: offsetY + height + radius / 2});
        circles.push({name: 'center-top', radius: radius, x: offsetX + width / 2, y: offsetY - radius / 2});
        circles.push({name: 'center-bottom', radius: radius, x: offsetX + width / 2, y: offsetY + height + radius / 2});
        circles.push({name: 'center-left', radius: radius, x: offsetX - radius / 2, y: offsetY + height / 2});
        circles.push({name: 'center-right', radius: radius, x: offsetX + width + radius / 2, y: offsetY + height / 2});
        circles.push({name: 'positioner', radius: radius * 2, x: offsetX + width / 2, y: offsetY - radius * 8, icon: this.moveIcon});
        circles.push({name: 'rotator', radius: radius * 2, x: offsetX + width / 2, y: offsetY - radius * 16, icon: this.rotateIcon});
        let angle = this.editor.activeLayer.rotation;
        if (angle != 0) {
            for (let circle of circles) {
                circle.x = Math.round(circle.x);
                circle.y = Math.round(circle.y);
                let [cx, cy] = [offsetX + width / 2, offsetY + height / 2];
                let [x, y] = [circle.x - cx, circle.y - cy];
                [x, y] = [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
                [circle.x, circle.y] = [x + cx, y + cy];
            }
        }
        return circles;
    }

    getControlCircle(name) {
        return this.activeLayerControlCircles().find(c => c.name == name);
    }

    draw() {
        this.fixCursor();
        for (let circle of this.activeLayerControlCircles()) {
            this.editor.ctx.strokeStyle = '#ffffff';
            this.editor.ctx.fillStyle = '#000000';
            if (this.editor.isMouseInCircle(circle.x, circle.y, circle.radius)) {
                this.editor.canvas.style.cursor = 'grab';
                this.editor.ctx.strokeStyle = '#000000';
                this.editor.ctx.fillStyle = '#ffffff';
            }
            this.editor.ctx.lineWidth = 1;
            if (circle.icon) {
                this.editor.ctx.save();
                this.editor.ctx.filter = 'invert(1)';
                for (let offset of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                    this.editor.ctx.drawImage(circle.icon, circle.x - circle.radius + offset[0], circle.y - circle.radius + offset[1], circle.radius * 2, circle.radius * 2);
                }
                this.editor.ctx.restore();
                this.editor.ctx.drawImage(circle.icon, circle.x - circle.radius, circle.y - circle.radius, circle.radius * 2, circle.radius * 2);
            }
            else {
                this.editor.ctx.beginPath();
                this.editor.ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
                this.editor.ctx.fill();
                this.editor.ctx.stroke();
            }
        }
    }

    onMouseDown(e) {
        this.fixCursor();
        this.currentDragCircle = null;
        for (let circle of this.activeLayerControlCircles()) {
            if (this.editor.isMouseInCircle(circle.x, circle.y, circle.radius)) {
                this.currentDragCircle = circle.name;
                break;
            }
        }
    }

    onMouseUp(e) {
        this.fixCursor();
        this.currentDragCircle = null;
    }

    onGlobalMouseMove(e) {
        if (this.editor.mouseDown) {
            let dx = (this.editor.mouseX - this.editor.lastMouseX) / this.editor.zoomLevel;
            let dy = (this.editor.mouseY - this.editor.lastMouseY) / this.editor.zoomLevel;
            let target = this.editor.activeLayer;
            let [mouseX, mouseY] = this.editor.canvasCoordToImageCoord(this.editor.mouseX, this.editor.mouseY);
            if (this.currentDragCircle == 'rotator') {
                let centerX = target.offsetX + target.width / 2;
                let centerY = target.offsetY + target.height / 2;
                target.rotation = Math.atan2(mouseY - centerY, mouseX - centerX) + Math.PI / 2;
                if (e.ctrlKey) {
                    target.rotation = Math.round(target.rotation / (Math.PI / 16)) * (Math.PI / 16);
                }
                this.editor.markChanged();
            }
            else if (this.currentDragCircle) {
                let current = this.getControlCircle(this.currentDragCircle);
                let [circleX, circleY] = this.editor.canvasCoordToImageCoord(current.x, current.y);
                let roundFactor = 1;
                if (e.ctrlKey) {
                    roundFactor = 8;
                    while (roundFactor * this.editor.zoomLevel < 16) {
                        roundFactor *= 4;
                    }
                }
                function applyRotate(x, y, angle = null) {
                    let [cx, cy] = [target.offsetX + target.width / 2, target.offsetY + target.height / 2];
                    if (angle == null) {
                        angle = target.rotation;
                    }
                    [x, y] = [x - cx, y - cy];
                    [x, y] = [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
                    [x, y] = [x + cx, y + cy];
                    return [x, y];
                }
                if (!e.shiftKey && !current.name.startsWith('center') && current.name != 'positioner') {
                    let [cX, cY] = [target.offsetX + target.width / 2, target.offsetY + target.height / 2];
                    let [dirX, dirY] = [circleX - cX, circleY - cY];
                    let lineLen = Math.sqrt(dirX * dirX + dirY * dirY);
                    [dirX, dirY] = [dirX / lineLen, dirY / lineLen];
                    let [vX, vY] = [mouseX - cX, mouseY - cY];
                    let d = vX * dirX + vY * dirY;
                    [mouseX, mouseY] = [cX + dirX * d, cY + dirY * d];
                }
                let dx = Math.round(mouseX / roundFactor) * roundFactor - circleX;
                let dy = Math.round(mouseY / roundFactor) * roundFactor - circleY;
                if (current.name == 'positioner') {
                    target.offsetX += dx;
                    target.offsetY += dy;
                }
                else {
                    [dx, dy] = [dx * Math.cos(-target.rotation) - dy * Math.sin(-target.rotation), dx * Math.sin(-target.rotation) + dy * Math.cos(-target.rotation)];
                    let [origX, origY] = [target.offsetX, target.offsetY];
                    let [origWidth, origHeight] = [target.width, target.height];
                    if (current.name == 'top-left') {
                        let [origBRX, origBRY] = applyRotate(origX + origWidth, origY + origHeight);
                        let widthChange = Math.min(dx, target.width - 1);
                        let heightChange = Math.min(dy, target.height - 1);
                        target.offsetX += widthChange;
                        target.offsetY += heightChange;
                        target.width -= widthChange;
                        target.height -= heightChange;
                        let [newBRX, newBRY] = applyRotate(target.offsetX + target.width, target.offsetY + target.height);
                        target.offsetX += origBRX - newBRX;
                        target.offsetY += origBRY - newBRY;
                    }
                    else if (current.name == 'top-right') {
                        let [origBLX, origBLY] = applyRotate(origX, origY + origHeight);
                        let widthChange = Math.max(dx, 1- target.width);
                        let heightChange = Math.min(dy, target.height - 1);
                        target.offsetY += heightChange;
                        target.width += widthChange;
                        target.height -= heightChange;
                        let [newBLX, newBLY] = applyRotate(target.offsetX, target.offsetY + target.height);
                        target.offsetX += origBLX - newBLX;
                        target.offsetY += origBLY - newBLY;
                    }
                    else if (current.name == 'bottom-left') {
                        let [origTRX, origTRY] = applyRotate(origX + origWidth, origY);
                        let widthChange = Math.min(dx, target.width - 1);
                        let heightChange = Math.max(dy, 1 - target.height);
                        target.offsetX += widthChange;
                        target.width -= widthChange;
                        target.height += heightChange;
                        let [newTRX, newTRY] = applyRotate(target.offsetX + target.width, target.offsetY);
                        target.offsetX += origTRX - newTRX;
                        target.offsetY += origTRY - newTRY;
                    }
                    else if (current.name == 'bottom-right') {
                        let [origTLX, origTLY] = applyRotate(origX, origY);
                        let widthChange = Math.max(dx, 1 - target.width);
                        let heightChange = Math.max(dy, 1 - target.height);
                        target.width += widthChange;
                        target.height += heightChange;
                        let [newTLX, newTLY] = applyRotate(target.offsetX, target.offsetY);
                        target.offsetX += origTLX - newTLX;
                        target.offsetY += origTLY - newTLY;
                    }
                    else if (current.name == 'center-top') {
                        let [origCBX, origCBY] = applyRotate(origX + origWidth / 2, origY + origHeight);
                        let heightChange = Math.min(dy, target.height - 1);
                        target.offsetY += heightChange;
                        target.height -= heightChange;
                        let [newCBX, newCBY] = applyRotate(target.offsetX + target.width / 2, target.offsetY + target.height);
                        target.offsetX += origCBX - newCBX;
                        target.offsetY += origCBY - newCBY;
                    }
                    else if (current.name == 'center-bottom') {
                        let [origCTX, origCTY] = applyRotate(origX + origWidth / 2, origY);
                        let heightChange = Math.max(dy, 1 - target.height);
                        target.height += heightChange;
                        let [newCTX, newCTY] = applyRotate(target.offsetX + target.width / 2, target.offsetY);
                        target.offsetX += origCTX - newCTX;
                        target.offsetY += origCTY - newCTY;
                    }
                    else if (current.name == 'center-left') {
                        let [origCRX, origCRY] = applyRotate(origX + origWidth, origY + origHeight / 2);
                        let widthChange = Math.min(dx, target.width - 1);
                        target.offsetX += widthChange;
                        target.width -= widthChange;
                        let [newCRX, newCRY] = applyRotate(target.offsetX + target.width, target.offsetY + target.height / 2);
                        target.offsetX += origCRX - newCRX;
                        target.offsetY += origCRY - newCRY;
                    }
                    else if (current.name == 'center-right') {
                        let [origCLX, origCLY] = applyRotate(origX, origY + origHeight / 2);
                        let widthChange = Math.max(dx, 1 - target.width);
                        target.width += widthChange;
                        let [newCLX, newCLY] = applyRotate(target.offsetX, target.offsetY + target.height / 2);
                        target.offsetX += origCLX - newCLX;
                        target.offsetY += origCLY - newCLY;
                    }
                }
                this.editor.markChanged();
            }
            else {
                this.editor.offsetX += dx;
                this.editor.offsetY += dy;
            }
            return true;
        }
        return false;
    }
}

/**
 * The layer-move tool.
 */
class ImageEditorToolMove extends ImageEditorTool {
    constructor(editor) {
        super(editor, 'move', 'move', 'Move', 'Free-move the current layer.');
    }

    onGlobalMouseMove(e) {
        if (this.editor.mouseDown) {
            this.editor.activeLayer.offsetX += (this.editor.mouseX - this.editor.lastMouseX) / this.editor.zoomLevel;
            this.editor.activeLayer.offsetY += (this.editor.mouseY - this.editor.lastMouseY) / this.editor.zoomLevel;
            this.editor.markChanged();
            return true;
        }
        return false;
    }
}

/**
 * The Paintbrush tool (also the base used for other brush-likes, such as the Eraser).
 */
class ImageEditorToolBrush extends ImageEditorTool {
    constructor(editor, id, icon, name, description, isEraser) {
        super(editor, id, icon, name, description);
        this.cursor = 'none';
        this.color = '#000000';
        this.radius = 10;
        this.opacity = 1;
        this.brushing = false;
        this.isEraser = isEraser;
        let colorHTML = `
        <div class="image-editor-tool-block">
            <label>Color:&nbsp;</label>
            <input type="text" class="auto-number id-col1" style="width:75px;flex-grow:0;" value="#000000">
            <input type="color" class="id-col2" value="#000000">
        </div>`;
        let radiusHtml = `<div class="image-editor-tool-block id-rad-block">
                <label>Radius:&nbsp;</label>
                <input type="number" style="width: 40px;" class="auto-number id-rad1" min="1" max="1024" step="1" value="10">
                <input type="range" style="flex-grow: 2" data-ispot="true" class="auto-slider-range id-rad2" min="1" max="1024" step="1" value="10">
            </div>`
        let opacityHtml = `<div class="image-editor-tool-block id-opac-block">
                <label>Opacity:&nbsp;</label>
                <input type="number" style="width: 40px;" class="auto-number id-opac1" min="1" max="100" step="1" value="100">
                <input type="range" style="flex-grow: 2" class="auto-slider-range id-opac2" min="1" max="100" step="1" value="100">
            </div>`;
        if (isEraser) {
            this.configDiv.innerHTML = radiusHtml + opacityHtml;
        }
        else {
            this.configDiv.innerHTML = colorHTML + radiusHtml + opacityHtml;
            this.colorText = this.configDiv.querySelector('.id-col1');
            this.colorSelector = this.configDiv.querySelector('.id-col2');
            this.colorText.addEventListener('input', () => {
                this.colorSelector.value = this.colorText.value;
                this.onConfigChange();
            });
            this.colorSelector.addEventListener('change', () => {
                this.colorText.value = this.colorSelector.value;
                this.onConfigChange();
            });
        }
        enableSliderForBox(this.configDiv.querySelector('.id-rad-block'));
        enableSliderForBox(this.configDiv.querySelector('.id-opac-block'));
        this.radiusNumber = this.configDiv.querySelector('.id-rad1');
        this.radiusSelector = this.configDiv.querySelector('.id-rad2');
        this.opacityNumber = this.configDiv.querySelector('.id-opac1');
        this.opacitySelector = this.configDiv.querySelector('.id-opac2');
        this.radiusNumber.addEventListener('change', () => { this.onConfigChange(); });
        this.opacityNumber.addEventListener('change', () => { this.onConfigChange(); });
    }

    onConfigChange() {
        if (!this.isEraser) {
            this.color = this.colorText.value;
        }
        this.radius = parseInt(this.radiusNumber.value);
        this.opacity = parseInt(this.opacityNumber.value) / 100;
        this.editor.redraw();
    }

    draw() {
        this.drawCircleBrush(this.editor.mouseX, this.editor.mouseY, this.radius * this.editor.zoomLevel);
    }

    brush() {
        let [lastX, lastY] = this.editor.activeLayer.canvasCoordToLayerCoord(this.editor.lastMouseX, this.editor.lastMouseY);
        let [x, y] = this.editor.activeLayer.canvasCoordToLayerCoord(this.editor.mouseX, this.editor.mouseY);
        this.bufferLayer.drawFilledCircle(lastX, lastY, this.radius, this.color);
        this.bufferLayer.drawFilledCircleStrokeBetween(lastX, lastY, x, y, this.radius, this.color);
        this.bufferLayer.drawFilledCircle(x, y, this.radius, this.color);
        this.editor.markChanged();
    }

    onMouseDown(e) {
        if (this.brushing) {
            return;
        }
        this.brushing = true;
        let target = this.editor.activeLayer;
        this.bufferLayer = new ImageEditorLayer(this.editor, target.canvas.width, target.canvas.height, target);
        this.bufferLayer.opacity = this.opacity;
        if (this.isEraser) {
            this.bufferLayer.globalCompositeOperation = 'destination-out';
        }
        target.childLayers.push(this.bufferLayer);
        this.brush();
    }

    onMouseMove(e) {
        if (this.brushing) {
            this.brush();
        }
    }

    onMouseWheel(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            let newRadius = parseInt(this.radius * Math.pow(1.1, -e.deltaY / 100));
            if (newRadius == this.radius) {
                newRadius += e.deltaY > 0 ? -1 : 1;
            }
            this.radiusNumber.value = Math.max(1, Math.min(1024, newRadius));
            this.radiusNumber.dispatchEvent(new Event('input'));
            this.radiusNumber.dispatchEvent(new Event('change'));
        }
    }

    onGlobalMouseUp(e) {
        if (this.brushing) {
            this.editor.activeLayer.childLayers.pop();
            let offset = this.editor.activeLayer.getOffset();
            this.bufferLayer.drawToBackDirect(this.editor.activeLayer.ctx, -offset[0], -offset[1], 1);
            this.bufferLayer = null;
            this.brushing = false;
            return true;
        }
        return false;
    }
}

/**
 * A single layer within an image editing interface.
 * This can be real (user-controlled) OR sub-layers (sometimes user-controlled) OR temporary buffers.
 */
class ImageEditorLayer {
    constructor(editor, width, height, parent = null) {
        this.editor = editor;
        this.parent = parent;
        this.canvas = document.createElement('canvas');
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.offsetX = 0;
        this.offsetY = 0;
        this.rotation = 0;
        this.opacity = 1;
        this.globalCompositeOperation = 'source-over';
        this.childLayers = [];
        this.buffer = null;
        this.isMask = false;
    }

    getOffset() {
        let offseter = this;
        let [x, y] = [0, 0];
        while (offseter) {
            x += offseter.offsetX;
            y += offseter.offsetY;
            offseter = offseter.parent;
        }
        return [x, y];
    }

    ensureSize() {
        if (this.canvas.width != this.width || this.canvas.height != this.height) {
            this.resize(this.width, this.height);
        }
    }

    resize(width, height) {
        let newCanvas = document.createElement('canvas');
        newCanvas.width = width;
        newCanvas.height = height;
        let newCtx = newCanvas.getContext('2d');
        newCtx.drawImage(this.canvas, 0, 0, width, height);
        this.canvas = newCanvas;
        this.ctx = newCtx;
        this.width = width;
        this.height = height;
    }

    canvasCoordToLayerCoord(x, y) {
        let [x2, y2] = this.editor.canvasCoordToImageCoord(x, y);
        let [offsetX, offsetY] = this.getOffset();
        let relWidth = this.width / this.canvas.width;
        let relHeight = this.height / this.canvas.height;
        [x2, y2] = [x2 - offsetX, y2 - offsetY];
        let angle = -this.rotation;
        let [cx, cy] = [this.width / 2, this.height / 2];
        let [x3, y3] = [x2 - cx, y2 - cy];
        [x3, y3] = [x3 * Math.cos(angle) - y3 * Math.sin(angle), x3 * Math.sin(angle) + y3 * Math.cos(angle)];
        [x2, y2] = [x3 + cx, y3 + cy];
        [x2, y2] = [x2 / relWidth, y2 / relHeight];
        return [x2, y2];
    }

    layerCoordToCanvasCoord(x, y) {
        let [x2, y2] = this.editor.imageCoordToCanvasCoord(x, y);
        let [offsetX, offsetY] = this.getOffset();
        let relWidth = this.width / this.canvas.width;
        let relHeight = this.height / this.canvas.height;
        [x2, y2] = [x2 * relWidth + offsetX, y2 * relHeight + offsetY];
        return [x2, y2];
    }

    drawFilledCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawFilledCircleStrokeBetween(x1, y1, x2, y2, radius, color) {
        let angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
        let [rx, ry] = [radius * Math.cos(angle), radius * Math.sin(angle)];
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x1 + rx, y1 + ry);
        this.ctx.lineTo(x2 + rx, y2 + ry);
        this.ctx.lineTo(x2 - rx, y2 - ry);
        this.ctx.lineTo(x1 - rx, y1 - ry);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawToBackDirect(ctx, offsetX, offsetY, zoom) {
        ctx.save();
        let [thisOffsetX, thisOffsetY] = this.getOffset();
        let x = offsetX + thisOffsetX;
        let y = offsetY + thisOffsetY;
        ctx.globalAlpha = this.opacity;
        ctx.globalCompositeOperation = this.globalCompositeOperation;
        let [cx, cy] = [this.width / 2, this.height / 2];
        ctx.translate((x + cx) * zoom, (y + cy) * zoom);
        ctx.rotate(this.rotation);
        ctx.drawImage(this.canvas, -cx * zoom, -cy * zoom, this.width * zoom, this.height * zoom);
        ctx.restore();
    }

    drawToBack(ctx, offsetX, offsetY, zoom) {
        if (this.childLayers.length > 0) {
            if (this.buffer == null) {
                this.buffer = new ImageEditorLayer(this.editor, this.canvas.width, this.canvas.height);
                this.buffer.width = this.width;
                this.buffer.height = this.height;
                this.buffer.rotation = this.rotation;
            }
            let offset = this.getOffset();
            this.buffer.offsetX = this.offsetX;
            this.buffer.offsetY = this.offsetY;
            this.buffer.opacity = this.opacity;
            this.buffer.globalCompositeOperation = this.globalCompositeOperation;
            this.buffer.ctx.globalAlpha = 1;
            this.buffer.ctx.globalCompositeOperation = 'source-over';
            this.buffer.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.buffer.ctx.drawImage(this.canvas, 0, 0);
            for (let layer of this.childLayers) {
                layer.drawToBack(this.buffer.ctx, -offset[0], -offset[1], 1);
            }
            this.buffer.drawToBackDirect(ctx, offsetX, offsetY, zoom);
        }
        else {
            this.buffer = null;
            this.drawToBackDirect(ctx, offsetX, offsetY, zoom);
        }
    }
}

/**
 * The central class managing the image editor interface.
 */
class ImageEditor {
    constructor(div, allowMasks = true, useExperimental = true, doFit = null, signalChanged = null) {
        // Configurables:
        this.zoomRate = 1.1;
        this.gridScale = 4;
        this.backgroundColor = '#202020';
        this.gridColor = '#404040';
        this.uiColor = '#606060';
        this.uiBorderColor = '#b0b0b0';
        this.textColor = '#ffffff';
        this.boundaryColor = '#ffff00';
        // Data:
        this.doFit = doFit;
        this.signalChanged = signalChanged;
        this.changeCount = 0;
        this.active = false;
        this.inputDiv = div;
        this.leftBar = createDiv(null, 'image_editor_leftbar');
        this.inputDiv.appendChild(this.leftBar);
        this.rightBar = createDiv(null, 'image_editor_rightbar');
        this.rightBar.innerHTML = `<div class="image_editor_newlayer_button basic-button image-editor-close-button interrupt-button" title="Close the Image Editor">&times;</div>`;
        this.rightBar.innerHTML += `<div class="image_editor_newlayer_button basic-button new-image-layer-button" title="New Image Layer">+${allowMasks ? 'Image' : 'Layer'}</div>`;
        if (allowMasks) {
            this.rightBar.innerHTML += `<div class="image_editor_newlayer_button basic-button new-mask-layer-button" title="New Mask Layer">+Mask</div>`;
        }
        this.inputDiv.appendChild(this.rightBar);
        this.rightBar.querySelector('.image-editor-close-button').addEventListener('click', () => {
            this.deactivate();
        });
        this.rightBar.querySelector('.new-image-layer-button').addEventListener('click', () => {
            this.addEmptyLayer();
        });
        if (allowMasks) {
            this.rightBar.querySelector('.new-mask-layer-button').addEventListener('click', () => {
                this.addEmptyMaskLayer();
            });
        }
        this.canvasList = createDiv(null, 'image_editor_canvaslist');
        // canvas entries can be dragged
        this.canvasList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        this.canvasList.addEventListener('drop', (e) => {
            let target = findParentOfClass(e.target, 'image_editor_layer_preview');
            if (!target) {
                return;
            }
            let dragIndex = this.layers.indexOf(this.draggingLayer);
            let targetIndex = this.layers.indexOf(target.layer);
            if (dragIndex < 0 || targetIndex < 0 || dragIndex == targetIndex) {
                return;
            }
            this.layers.splice(dragIndex, 1);
            targetIndex = this.layers.indexOf(target.layer);
            if (e.offsetY > target.clientHeight / 2) {
                if (target.nextSibling) {
                    this.canvasList.insertBefore(this.draggingLayer.div, target.nextSibling);
                }
                else {
                    this.canvasList.appendChild(this.draggingLayer.div);
                }
            }
            else {
                targetIndex++;
                this.canvasList.insertBefore(this.draggingLayer.div, target);
            }
            this.layers.splice(targetIndex, 0, this.draggingLayer);
            this.redraw();
        });
        this.canvasList.addEventListener('dragenter', (e) => {
            e.preventDefault();
        });
        this.rightBar.appendChild(this.canvasList);
        this.bottomBar = createDiv(null, 'image_editor_bottombar');
        this.inputDiv.appendChild(this.bottomBar);
        this.zoomLevel = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.tools = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseDown = false;
        this.layers = [];
        this.activeLayer = null;
        this.realWidth = 512;
        this.realHeight = 512;
        this.finalOffsetX = 0;
        this.finalOffsetY = 0;
        // Tools:
        this.addTool(new ImageEditorToolGeneral(this));
        this.activateTool('general');
        this.addTool(new ImageEditorToolMove(this));
        if (useExperimental) {
            this.addTool(new ImageEditorTool(this, 'select', 'select', 'Select', 'Select a region of the image.'));
        }
        this.addTool(new ImageEditorToolBrush(this, 'brush', 'paintbrush', 'Paintbrush', 'Draw on the image.', false));
        this.addTool(new ImageEditorToolBrush(this, 'eraser', 'eraser', 'Eraser', 'Erase parts of the image.', true));
    }

    addTool(tool) {
        this.tools[tool.id] = tool;
    }

    activateTool(id) {
        if (this.activeTool) {
            this.activeTool.setInactive();
        }
        this.tools[id].setActive();
        this.activeTool = this.tools[id];
    }

    createCanvas() {
        let canvas = document.createElement('canvas');
        canvas.tabIndex = 1; // Force to be selectable
        canvas.className = 'image-editor-canvas';
        this.inputDiv.insertBefore(canvas, this.rightBar);
        this.canvas = canvas;
        canvas.addEventListener('wheel', (e) => this.onMouseWheel(e));
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onGlobalMouseUp(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('mousemove', (e) => this.onGlobalMouseMove(e));
        canvas.addEventListener('keydown', (e) => this.onKeyDown(e));
        canvas.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('keydown', (e) => this.onGlobalKeyDown(e));
        document.addEventListener('keyup', (e) => this.onGlobalKeyUp(e));
        this.ctx = canvas.getContext('2d');
        canvas.style.cursor = 'none';
        this.resize();
    }

    handleAltDown() {
        if (!this.preAltTool) {
            this.preAltTool = this.activeTool;
            this.activateTool('general');
            this.redraw();
        }
    }

    handleAltUp() {
        if (this.preAltTool) {
            this.activateTool(this.preAltTool.id);
            this.preAltTool = null;
            this.redraw();
        }
    }

    onKeyDown(e) {
        if (e.key === 'Alt') {
            e.preventDefault();
            this.handleAltDown();
        }
    }

    onGlobalKeyDown(e) {
        if (e.key == 'Alt') {
            this.altDown = true;
        }
    }

    onKeyUp() {
    }

    onGlobalKeyUp(e) {
        if (e.key === 'Alt') {
            this.altDown = false;
            this.handleAltUp();
        }
    }

    onMouseWheel(e) {
        this.activeTool.onMouseWheel(e);
        if (!e.defaultPrevented) {
            let zoom = Math.pow(this.zoomRate, -e.deltaY / 100);
            let mouseX = e.clientX - this.canvas.offsetLeft;
            let mouseY = e.clientY - this.canvas.offsetTop;
            let [origX, origY] = this.canvasCoordToImageCoord(mouseX, mouseY);
            this.zoomLevel *= zoom;
            let [newX, newY] = this.canvasCoordToImageCoord(mouseX, mouseY);
            this.offsetX += newX - origX;
            this.offsetY += newY - origY;
        }
        this.redraw();
    }

    onMouseDown(e) {
        if (this.altDown || e.button == 1) {
            this.handleAltDown();
        }
        this.mouseDown = true;
        this.activeTool.onMouseDown(e);
        this.redraw();
    }

    onMouseUp(e) {
        if (e.button == 1) {
            this.handleAltUp();
        }
        this.mouseDown = false;
        this.activeTool.onMouseUp(e);
        this.redraw();
    }

    onGlobalMouseUp(e) {
        let wasDown = this.mouseDown;
        this.mouseDown = false;
        if (this.activeTool.onGlobalMouseUp(e) || wasDown) {
            this.redraw();
        }
    }

    onGlobalMouseMove(e) {
        this.mouseX = e.clientX - this.canvas.offsetLeft;
        this.mouseY = e.clientY - this.canvas.offsetTop;
        let draw = false;
        if (this.isMouseInBox(0, 0, this.canvas.width, this.canvas.height)) {
            this.activeTool.onMouseMove(e);
            draw = true;
        }
        if (this.activeTool.onGlobalMouseMove(e)) {
            draw = true;
        }
        if (draw) {
            this.redraw();
        }
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
    }

    canvasCoordToImageCoord(x, y) {
        return [x / this.zoomLevel - this.offsetX, y / this.zoomLevel - this.offsetY];
    }

    imageCoordToCanvasCoord(x, y) {
        return [(x + this.offsetX) * this.zoomLevel, (y + this.offsetY) * this.zoomLevel];
    }

    isMouseInBox(x, y, width, height) {
        return this.mouseX >= x && this.mouseX < x + width && this.mouseY >= y && this.mouseY < y + height;
    }

    isMouseInCircle(x, y, radius) {
        let dx = this.mouseX - x;
        let dy = this.mouseY - y;
        return dx * dx + dy * dy < radius * radius;
    }

    activate() {
        this.active = true;
        this.inputDiv.style.display = 'inline-block';
        this.doParamHides();
        this.doFit();
        if (!this.canvas) {
            this.createCanvas();
        }
        else {
            this.resize();
        }
    }

    deactivate() {
        this.active = false;
        this.inputDiv.style.display = 'none';
        this.unhideParams();
        this.doFit();
    }

    setActiveLayer(layer) {
        if (this.activeLayer && this.activeLayer.div) {
            this.activeLayer.div.classList.remove('image_editor_layer_preview-active');
        }
        if (this.layers.indexOf(layer) == -1) {
            throw new Error(`layer not found, ${layer}`);
        }
        this.activeLayer = layer;
        if (layer && layer.div) {
            layer.div.classList.add('image_editor_layer_preview-active');
        }
        this.redraw();
    }

    clearLayers() {
        this.layers = [];
        this.activeLayer = null;
        this.realWidth = 512;
        this.realHeight = 512;
        this.finalOffsetX = 0;
        this.finalOffsetY = 0;
        this.canvasList.innerHTML = '';
    }

    addEmptyMaskLayer() {
        let layer = new ImageEditorLayer(this, this.realWidth, this.realHeight);
        layer.isMask = true;
        this.addLayer(layer);
    }

    addEmptyLayer() {
        let layer = new ImageEditorLayer(this, this.realWidth, this.realHeight);
        this.addLayer(layer);
    }

    removeLayer(layer) {
        let index = this.layers.indexOf(layer);
        if (index >= 0) {
            this.layers.splice(index, 1);
            this.canvasList.removeChild(layer.div);
            this.canvasList.removeChild(layer.menuPopover);
            if (this.activeLayer == layer) {
                this.setActiveLayer(this.layers[Math.max(0, index - 1)]);
            }
            this.redraw();
        }
    }

    addLayer(layer) {
        this.layers.push(layer);
        layer.div = createDiv(null, 'image_editor_layer_preview');
        layer.div.appendChild(layer.canvas);
        layer.div.addEventListener('click', (e) => {
            if (e.defaultPrevented) {
                return;
            }
            this.setActiveLayer(layer);
            this.redraw();
        }, true);
        // the div is draggable to re-order:
        layer.div.draggable = true;
        layer.div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', 'dummy');
            e.dataTransfer.effectAllowed = 'move';
            this.draggingLayer = layer;
        });
        layer.div.addEventListener('dragend', (e) => {
            this.draggingLayer = null;
        });
        layer.div.layer = layer;
        let popId = `image_editor_layer_preview_${this.layers.length - 1}`;
        let menuPopover = createDiv(`popover_${popId}`, 'sui-popover');
        layer.menuPopover = menuPopover;
        let buttonDelete = createDiv(null, 'sui_popover_model_button');
        buttonDelete.innerText = 'Delete Layer';
        buttonDelete.addEventListener('click', (e) => {
            e.preventDefault();
            hidePopover(popId);
            this.removeLayer(layer);
        }, true);
        menuPopover.appendChild(buttonDelete);
        let opacitySlider = document.createElement('input');
        opacitySlider.type = 'range';
        opacitySlider.min = '0';
        opacitySlider.max = '100';
        opacitySlider.step = '1';
        opacitySlider.value = layer.opacity * 100;
        opacitySlider.addEventListener('input', () => {
            layer.opacity = parseInt(opacitySlider.value) / 100;
            layer.canvas.style.opacity = layer.opacity;
            this.redraw();
        });
        let opacityLabel = document.createElement('label');
        opacityLabel.innerHTML = 'Opacity&nbsp;';
        let opacityDiv = createDiv(null, 'sui-popover-inline-block');
        opacityDiv.appendChild(opacityLabel);
        opacityDiv.appendChild(opacitySlider);
        menuPopover.appendChild(opacityDiv);
        layer.canvas.style.opacity = layer.opacity;
        layer.div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            menuPopover.style.top = `${e.clientY}px`;
            menuPopover.style.left = `${e.clientX}px`;
            showPopover(popId);
        });
        this.canvasList.appendChild(menuPopover);
        this.canvasList.insertBefore(layer.div, this.canvasList.firstChild);
        this.setActiveLayer(layer);
    }

    setBaseImage(img) {
        this.clearLayers();
        let layer = new ImageEditorLayer(this, img.naturalWidth, img.naturalHeight);
        layer.ctx.drawImage(img, 0, 0);
        this.addLayer(layer);
        let layer2 = new ImageEditorLayer(this, img.naturalWidth, img.naturalHeight);
        this.addLayer(layer2);
        this.realWidth = img.naturalWidth;
        this.realHeight = img.naturalHeight;
        if (this.active) {
            this.redraw();
        }
    }

    doParamHides() {
        let initImage = document.getElementById('input_initimage');
        let maskImage = document.getElementById('input_maskimage');
        if (initImage) {
            let parent = findParentOfClass(initImage, 'auto-input');
            parent.style.display = 'none';
            parent.dataset.visible_controlled = 'true';
        }
        if (maskImage) {
            let parent = findParentOfClass(maskImage, 'auto-input');
            parent.style.display = 'none';
            parent.dataset.visible_controlled = 'true';
        }
    }

    unhideParams() {
        let initImage = document.getElementById('input_initimage');
        let maskImage = document.getElementById('input_maskimage');
        if (initImage) {
            let parent = findParentOfClass(initImage, 'auto-input');
            parent.style.display = '';
            delete parent.dataset.visible_controlled;
        }
        if (maskImage) {
            let parent = findParentOfClass(maskImage, 'auto-input');
            parent.style.display = '';
            delete parent.dataset.visible_controlled;
        }
    }

    renderFullGrid(scale, width, color) {
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.lineWidth = width;
        let [leftX, topY] = this.canvasCoordToImageCoord(0, 0);
        let [rightX, bottomY] = this.canvasCoordToImageCoord(this.canvas.width, this.canvas.height);
        for (let x = Math.floor(leftX / scale) * scale; x < rightX; x += scale) {
            let [canvasX, _] = this.imageCoordToCanvasCoord(x, 0);
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, this.canvas.height);
        }
        for (let y = Math.floor(topY / scale) * scale; y < bottomY; y += scale) {
            let [_, canvasY] = this.imageCoordToCanvasCoord(0, y);
            this.ctx.moveTo(0, canvasY);
            this.ctx.lineTo(this.canvas.width, canvasY);
        }
        this.ctx.stroke();
    }

    autoWrapText(text, maxWidth) {
        let lines = [];
        let rawLines = text.split('\n');
        for (let rawLine of rawLines) {
            let words = rawLine.split(' ');
            let line = '';
            for (let word of words) {
                let newLine = line + word + ' ';
                if (this.ctx.measureText(newLine).width > maxWidth) {
                    lines.push(line);
                    line = word + ' ';
                }
                else {
                    line = newLine;
                }
            }
            lines.push(line);
        }
        return lines;
    }

    drawTextBubble(text, font, x, y, maxWidth) {
        this.ctx.font = font;
        let lines = this.autoWrapText(text, maxWidth - 10);
        let widest = lines.map(line => this.ctx.measureText(line).width).reduce((a, b) => Math.max(a, b));
        let metrics = this.ctx.measureText(text);
        let fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
        this.drawBox(x - 1, y - 1, widest + 10, (fontHeight * lines.length) + 10, this.uiColor, this.uiBorderColor);
        let currentY = y;
        this.ctx.fillStyle = this.textColor;
        this.ctx.textBaseline = 'top';
        for (let line of lines) {
            this.ctx.fillText(line, x + 5, currentY + 5);
            currentY += fontHeight;
        }
    }

    drawBox(x, y, width, height, color, borderColor) {
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + width, y);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.lineTo(x, y + height);
        this.ctx.closePath();
        this.ctx.fill();
        if (borderColor) {
            this.ctx.strokeStyle = borderColor;
            this.ctx.stroke();
        }
    }

    markChanged() {
        this.changeCount++;
        if (this.signalChanged) {
            this.signalChanged();
        }
    }

    resize() {
        if (this.canvas) {
            this.canvas.width = Math.max(100, this.inputDiv.clientWidth - this.leftBar.clientWidth - this.rightBar.clientWidth);
            this.canvas.height = Math.max(100, this.inputDiv.clientHeight - this.bottomBar.clientHeight);
            this.redraw();
            this.markChanged();
        }
    }

    drawSelectionBox(x, y, width, height, color, spacing, angle) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.setLineDash([spacing, spacing]);
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.rotate(angle);
        this.ctx.moveTo(-width / 2 - 1, -height / 2 - 1);
        this.ctx.lineTo(width / 2 + 1, -height / 2 - 1);
        this.ctx.lineTo(width / 2 + 1, height / 2 + 1);
        this.ctx.lineTo(-width / 2 - 1, height / 2 + 1);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
    }

    redraw() {
        if (!this.canvas) {
            return;
        }
        this.ctx.save();
        this.canvas.style.cursor = this.activeTool.cursor;
        // Background:
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        let gridScale = this.gridScale;
        while (gridScale * this.zoomLevel < 32) {
            gridScale *= 8;
        }
        if (gridScale > this.gridScale) {
            let factor = (gridScale * this.zoomLevel - 32) / (32 * 8);
            let frac = factor * 100;
            this.renderFullGrid(gridScale / 8, 1, `color-mix(in srgb, ${this.gridColor} ${frac}%, ${this.backgroundColor})`);
        }
        this.renderFullGrid(gridScale, 3, this.gridColor);
        // Layers:
        for (let layer of this.layers) {
            layer.drawToBack(this.ctx, this.offsetX, this.offsetY, this.zoomLevel);
        }
        this.ctx.globalAlpha = 1;
        // UI:
        let [boundaryX, boundaryY] = this.imageCoordToCanvasCoord(this.finalOffsetX, this.finalOffsetY);
        this.drawSelectionBox(boundaryX, boundaryY, this.realWidth * this.zoomLevel, this.realHeight * this.zoomLevel, this.boundaryColor, 16 * this.zoomLevel, 0);
        let [offsetX, offsetY] = this.imageCoordToCanvasCoord(this.activeLayer.offsetX, this.activeLayer.offsetY);
        this.drawSelectionBox(offsetX, offsetY, this.activeLayer.width * this.zoomLevel, this.activeLayer.height * this.zoomLevel, this.uiBorderColor, 8 * this.zoomLevel, this.activeLayer.rotation);
        this.activeTool.draw();
        this.ctx.restore();
    }

    getFinalImageData(format = 'image/png') {
        let canvas = document.createElement('canvas');
        canvas.width = this.realWidth;
        canvas.height = this.realHeight;
        let ctx = canvas.getContext('2d');
        for (let layer of this.layers) {
            if (!layer.isMask) {
                layer.drawToBack(ctx, this.finalOffsetX, this.finalOffsetY, 1);
            }
        }
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
        return canvas.toDataURL(format);
    }

    getFinalMaskData(format = 'image/png') {
        let canvas = document.createElement('canvas');
        canvas.width = this.realWidth;
        canvas.height = this.realHeight;
        let ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let layer of this.layers) {
            if (layer.isMask) {
                layer.drawToBack(ctx, this.finalOffsetX, this.finalOffsetY, 1);
            }
        }
        return canvas.toDataURL(format);
    }
}
