
/**
 * Calculate the 7 phases of the motion.
 * ```text
 * - 1 to 3 : acceleration ramp
 * - 4      : constant speed
 * - 5 to 7 : deceleration ramp
 * ```
 * @param {object} prm - The parameters object
 * @return {array} The phases array 
 */
function calcMotionPhases(prm) {
  var ph = [];

  // init phases
  for (let i = 0; i <= 8; i++) {
    ph[i] = {
      t0: 0,
      t1: 0,
      a: 0,
      aPerc: 0,
      v0: 0,
      v1: 0,
      s0: 0,
      s1: 0,
    }
    ph[i].desc = ((i >= 1) & (i <= 7)) ? `phase ${i}` : null;
  }

  const tA = prm.tx.value;
  const tC = prm.tx.value;
  const tB = prm.tRamp.value - tA - tC;

  const aPercA = prm.a0.value;
  const aPercB = prm.a0.value + prm.a1.value;
  const aPercC = prm.a1.value;

  // -------------------------------------
  // acceleration reference
  // -------------------------------------

  // average acceleration over the entire ramp [mm/s²]
  // const aAvg = (vSet / tRamp) * 1000;

  // reference acceleration for the parts of the ramp
  const aRef = (prm.vSet.value / (prm.tRamp.value - prm.tx.value)) * 1000;
  const aA = aRef * (aPercA / 100);
  const aB = aRef * (aPercB / 100);
  const aC = aRef * (aPercC / 100);

  // -------------------------------------
  // phase 1-3; acceleration ramp
  // -------------------------------------
  // part a
  ph[1].aPerc = aPercA;
  ph[1].a = aA;
  ph[1].t0 = 0;
  ph[1].v0 = 0;
  ph[1].s0 = prm.pos0.value;
  ph[1].t1 = ph[1].t0 + tA;
  ph[1].v1 = calcVelocity(ph[1].v0, ph[1].t0, ph[1].a, ph[1].t1);
  ph[1].s1 = calcPosition(ph[1].s0, ph[1].v0, ph[1].t0, ph[1].a, ph[1].t1);

  // part b
  ph[2].aPerc = aPercB;
  ph[2].a = aB;
  ph[2].t0 = ph[1].t1;
  ph[2].v0 = ph[1].v1;
  ph[2].s0 = ph[1].s1;
  ph[2].t1 = ph[2].t0 + tB;
  ph[2].v1 = calcVelocity(ph[2].v0, ph[2].t0, ph[2].a, ph[2].t1);
  ph[2].s1 = calcPosition(ph[2].s0, ph[2].v0, ph[2].t0, ph[2].a, ph[2].t1);

  // part c
  ph[3].aPerc = aPercC;
  ph[3].a = aC;
  ph[3].t0 = ph[2].t1;
  ph[3].v0 = ph[2].v1;
  ph[3].s0 = ph[2].s1;
  ph[3].t1 = ph[3].t0 + tC;
  ph[3].v1 = calcVelocity(ph[3].v0, ph[3].t0, ph[3].a, ph[3].t1);
  ph[3].s1 = calcPosition(ph[3].s0, ph[3].v0, ph[3].t0, ph[3].a, ph[3].t1);


  // -------------------------------------
  // phase 5-7; deceleration ramp
  // - calculated immediately after the acceleration ramp
  // - afterwards, the remaining distance is used to
  //   correct the starting position and -time of this deceleration ramp
  // -------------------------------------
  // part a
  ph[5].aPerc = -aPercA;
  ph[5].a = -aA;
  ph[5].t0 = ph[3].t1;
  ph[5].v0 = ph[3].v1;
  ph[5].s0 = ph[3].s1;
  ph[5].t1 = ph[5].t0 + tA;
  ph[5].v1 = calcVelocity(ph[5].v0, ph[5].t0, ph[5].a, ph[5].t1);
  ph[5].s1 = calcPosition(ph[5].s0, ph[5].v0, ph[5].t0, ph[5].a, ph[5].t1);

  // part b
  ph[6].aPerc = -aPercB;
  ph[6].a = -aB;
  ph[6].t0 = ph[5].t1;
  ph[6].v0 = ph[5].v1;
  ph[6].s0 = ph[5].s1;
  ph[6].t1 = ph[6].t0 + tB;
  ph[6].v1 = calcVelocity(ph[6].v0, ph[6].t0, ph[6].a, ph[6].t1);
  ph[6].s1 = calcPosition(ph[6].s0, ph[6].v0, ph[6].t0, ph[6].a, ph[6].t1);

  // part c
  ph[7].aPerc = -aPercC;
  ph[7].a = -aC;
  ph[7].t0 = ph[6].t1;
  ph[7].v0 = ph[6].v1;
  ph[7].s0 = ph[6].s1;
  ph[7].t1 = ph[7].t0 + tC;
  ph[7].v1 = calcVelocity(ph[7].v0, ph[7].t0, ph[7].a, ph[7].t1);
  ph[7].s1 = calcPosition(ph[7].s0, ph[7].v0, ph[7].t0, ph[7].a, ph[7].t1);


  // -------------------------------------
  // shift deceleration ramp
  // -------------------------------------
  // position and time correction
  const xCorr = prm.pos1.value - ph[7].s1;
  const tCorr = xCorr / (ph[3].v1) * 1000;

  for (let i = 5; i <= 7; i++) {
    ph[i].t0 = ph[i].t0 + tCorr;
    ph[i].s0 = ph[i].s0 + xCorr;
    ph[i].t1 = ph[i].t1 + tCorr;
    ph[i].s1 = ph[i].s1 + xCorr;
  }


  // -------------------------------------
  // phase 4; constant velocity
  // -------------------------------------
  ph[4].aPerc = 0;
  ph[4].a = 0;
  ph[4].t0 = ph[3].t1;
  ph[4].v0 = ph[3].v1;
  ph[4].s0 = ph[3].s1;
  ph[4].v1 = ph[4].v0;
  ph[4].s1 = ph[5].s0;
  ph[4].t1 = ph[5].t0;


  // -------------------------------------
  // plot motion profile phases
  // -------------------------------------
  ph[0].t0 = -50;
  ph[0].v0 = ph[1].v0;
  ph[0].s0 = ph[1].s0;
  ph[0].t1 = ph[1].t0;
  ph[0].v1 = ph[1].v0;
  ph[0].s1 = ph[1].s0;

  ph[8].t0 = ph[7].t1;
  ph[8].v0 = ph[7].v1;
  ph[8].s0 = ph[7].s1;
  ph[8].t1 = ph[8].t0 + 50;
  ph[8].v1 = ph[8].v0;
  ph[8].s1 = ph[8].s0;

  return ph;
}

/**
 * Calculate point (position) for each `tDelta` of the motion.
 * @param {object} prm - The parameters object
 * @param {object} phases - The phases object
 * @return {array} The points array 
 */
function calcMotionPoints(prm, phases) {
  var arr = [];

  for (let t = 0; t <= phases[7].t1; t += prm.tDelta.value) {
    switch (true) {
      //ph 1
      case t <= phases[1].t1:
        ph = 1;
        break;
      //ph 2
      case t <= phases[2].t1:
        ph = 2;
        break;
      //ph 3
      case t <= phases[3].t1:
        ph = 3;
        break;
      //ph 4
      case t <= phases[4].t1:
        ph = 4;
        break;
      //ph 5
      case t <= phases[5].t1:
        ph = 5;
        break;
      //ph 6
      case t <= phases[6].t1:
        ph = 6;
        break;
      //ph 7
      case t <= phases[7].t1:
        ph = 7;
        break;
    }

    var p = {};
    p.t = t;
    p.s = calcPosition(phases[ph].s0, phases[ph].v0, phases[ph].t0, phases[ph].a, t);
    arr.push(p);
  }
  return arr;
}
