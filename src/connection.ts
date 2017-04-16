interface pos {
    x: number;
    y: number;
}

interface shape {
    w: number;
    h: number;
}

function intersectLength(theta, alpha, width, height): shape {
    const beta = 2 * (Math.PI / 2 - alpha); // Angle between top corners
    let x;
    let y;

    if (theta >= -alpha && theta < alpha) {
        // 1st quadrant
        x = width / 2;
        y = width / 2 * Math.tan(theta);
    } else if (theta >= alpha && theta < alpha + beta) {
        // 2nd quadrant
        x = (height / 2) / Math.tan(theta);
        y = height / 2;
    } else if (theta >= alpha + beta || theta < -(alpha + beta)) {
        // 3rd quadrant
        x = -width / 2;
        y = -width / 2 * Math.tan(theta);
    } else {
        // 4th quadrant
        x = -(height / 2) / Math.tan(theta);
        y = -height / 2;
    }

    return {w: x, h: y};
}


export function drawConnection(prePos: pos, preDims: shape, postPos: pos, postDims: shape, g) {
    const line = createSVGElement("line");
    g.appendChild(line);
    const marker = createSVGElement("path");

    marker.setAttribute("d", "M 10 0 L -5 -5 L -5 5 z");

    g.appendChild(marker);
    line.setAttribute("x1", prePos.x);
    line.setAttribute("y1", prePos.y);
    line.setAttribute("x2", postPos.x);
    line.setAttribute("y2", postPos.y);

    // Angle between objects
    let angle = Math.atan2(
        postPos.y - prePos.y, postPos.x - prePos.x);

    const w1 = preDims.w;
    const h1 = preDims.h;
    const w2 = postDims.w;
    const h2 = postDims.h;

    const a1 = Math.atan2(h1, w1);
    const a2 = Math.atan2(h2, w2);

    const preLength = intersectLength(angle, a1, w1, h1);
    let postToPreAngle = angle - Math.PI;
    if (postToPreAngle < -Math.PI) {
        postToPreAngle += 2 * Math.PI;
    }
    const postLength =
        intersectLength(postToPreAngle, a2, w2, h2);

    let mx = (prePos.x + preLength.w) * 0.4 +
        (postPos.x + postLength.w) * 0.6;
    let my = (prePos.y + preLength.h) * 0.4 +
        (postPos.y + postLength.h) * 0.6;

    // Check to make sure the marker doesn't go past either endpoint
    const vec1 = [postPos.x - prePos.x, postPos.y - prePos.y];
    const vec2 = [mx - prePos.x, my - prePos.y];
    const dotProd = (vec1[0] * vec2[0] + vec1[1] * vec2[1]) /
        (vec1[0] * vec1[0] + vec1[1] * vec1[1]);

    if (dotProd < 0) {
        mx = prePos.x;
        my = prePos.y;
    } else if (dotProd > 1) {
        mx = postPos.x;
        my = postPos.y;
    }
    angle = 180 / Math.PI * angle;
    marker.setAttribute(
        "transform", `translate(${mx}, ${my}) rotate(${angle})`);
}
