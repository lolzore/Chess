/* Chess engine — shared by browser (window.Chess) and Node (module.exports) */
(function (global) {
"use strict";
const GLYPH = {
  w:{k:"\u2654",q:"\u2655",r:"\u2656",b:"\u2657",n:"\u2658",p:"\u2659"},
  b:{k:"\u265A",q:"\u265B",r:"\u265C",b:"\u265D",n:"\u265E",p:"\u265F"}
};
const FILES = "abcdefgh";
const sqName = (r,c) => FILES[c] + (8-r);

function initialState(){
  const b = Array.from({length:8}, () => Array(8).fill(null));
  const back = ["r","n","b","q","k","b","n","r"];
  for(let c=0;c<8;c++){
    b[0][c]={t:back[c],c:"b"}; b[1][c]={t:"p",c:"b"};
    b[6][c]={t:"p",c:"w"}; b[7][c]={t:back[c],c:"w"};
  }
  return {
    board:b, turn:"w",
    castling:{wK:true,wQ:true,bK:true,bQ:true},
    ep:null, halfmove:0,
    moves:[], captured:{w:[],b:[]},
    over:false, winner:null, reason:null, lastMove:null
  };
}
const cloneState = (s) => JSON.parse(JSON.stringify(s));

function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

function isAttacked(b, r, c, by){
  const dr = by==="w" ? 1 : -1;
  for(const dc of [-1,1]){
    if(inBounds(r+dr,c+dc)){ const p=b[r+dr][c+dc]; if(p && p.c===by && p.t==="p") return true; }
  }
  for(const [a,d] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){
    if(inBounds(r+a,c+d)){ const p=b[r+a][c+d]; if(p && p.c===by && p.t==="n") return true; }
  }
  for(const a of [-1,0,1]) for(const d of [-1,0,1]){
    if(!a && !d) continue;
    if(inBounds(r+a,c+d)){ const p=b[r+a][c+d]; if(p && p.c===by && p.t==="k") return true; }
  }
  for(const [a,d] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]){
    const pieceSet = (a!==0 && d!==0) ? "bq" : "rq";
    let rr=r+a, cc=c+d;
    while(inBounds(rr,cc)){
      const p=b[rr][cc];
      if(p){ if(p.c===by && pieceSet.includes(p.t)) return true; break; }
      rr+=a; cc+=d;
    }
  }
  return false;
}

function findKing(b, color){
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p=b[r][c];
    if(p && p.t==="k" && p.c===color) return [r,c];
  }
  return null;
}

function genPseudo(s, fr, fc){
  const b=s.board, p=b[fr][fc];
  if(!p) return [];
  const color=p.c, enemy = color==="w" ? "b" : "w";
  const ms=[];
  const push=(tr,tc,flags={})=>ms.push({fr,fc,tr,tc,...flags});
  const emptyOrEnemy=(r,c)=>{ const t=b[r][c]; return !t || t.c===enemy; };

  if(p.t==="p"){
    const dir = color==="w" ? -1 : 1;
    const startRow = color==="w" ? 6 : 1;
    const promoRow = color==="w" ? 0 : 7;
    if(inBounds(fr+dir,fc) && !b[fr+dir][fc]){
      push(fr+dir,fc, fr+dir===promoRow ? {promo:true} : {});
      if(fr===startRow && !b[fr+2*dir][fc]) push(fr+2*dir,fc);
    }
    for(const dc of [-1,1]){
      const tr=fr+dir, tc=fc+dc;
      if(!inBounds(tr,tc)) continue;
      const t=b[tr][tc];
      if(t && t.c===enemy) push(tr,tc, tr===promoRow ? {promo:true} : {});
      else if(!t && s.ep && s.ep[0]===tr && s.ep[1]===tc) push(tr,tc,{ep:true});
    }
  } else if(p.t==="n" || p.t==="k"){
    const dirs = p.t==="n"
      ? [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
      : [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for(const [a,d] of dirs){
      const tr=fr+a, tc=fc+d;
      if(inBounds(tr,tc) && emptyOrEnemy(tr,tc)) push(tr,tc);
    }
    if(p.t==="k"){
      const home = color==="w" ? 7 : 0;
      if(fr===home && fc===4 && !isAttacked(b,home,4,enemy)){
        const kRight = color==="w" ? s.castling.wK : s.castling.bK;
        const qRight = color==="w" ? s.castling.wQ : s.castling.bQ;
        if(kRight && !b[home][5] && !b[home][6]
           && b[home][7] && b[home][7].t==="r" && b[home][7].c===color
           && !isAttacked(b,home,5,enemy) && !isAttacked(b,home,6,enemy))
          push(home,6,{castle:"K"});
        if(qRight && !b[home][3] && !b[home][2] && !b[home][1]
           && b[home][0] && b[home][0].t==="r" && b[home][0].c===color
           && !isAttacked(b,home,3,enemy) && !isAttacked(b,home,2,enemy))
          push(home,2,{castle:"Q"});
      }
    }
  } else {
    const dirs = p.t==="r" ? [[-1,0],[1,0],[0,-1],[0,1]]
               : p.t==="b" ? [[-1,-1],[-1,1],[1,-1],[1,1]]
               : [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    for(const [a,d] of dirs){
      let tr=fr+a, tc=fc+d;
      while(inBounds(tr,tc)){
        const t=b[tr][tc];
        if(!t){ push(tr,tc); }
        else { if(t.c===enemy) push(tr,tc); break; }
        tr+=a; tc+=d;
      }
    }
  }
  return ms;
}

function applyToBoard(b, m){
  const p=b[m.fr][m.fc];
  b[m.fr][m.fc]=null;
  if(m.ep) b[m.fr][m.tc]=null;
  b[m.tr][m.tc] = m.promo && typeof m.promo === "string" ? {t:m.promo, c:p.c} : p;
  if(m.castle){
    const home = p.c==="w" ? 7 : 0;
    if(m.castle==="K"){ b[home][5]=b[home][7]; b[home][7]=null; }
    else { b[home][3]=b[home][0]; b[home][0]=null; }
  }
  return p;
}

function legalMoves(s, fr, fc){
  const p=s.board[fr][fc];
  if(!p) return [];
  const enemy = p.c==="w" ? "b" : "w";
  const out=[];
  for(const m of genPseudo(s, fr, fc)){
    const b2 = s.board.map(row => row.slice());
    applyToBoard(b2, m);
    const k = findKing(b2, p.c);
    if(k && !isAttacked(b2, k[0], k[1], enemy)) out.push(m);
  }
  return out;
}

function allLegalMoves(s){
  const out=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p=s.board[r][c];
    if(p && p.c===s.turn) out.push(...legalMoves(s,r,c));
  }
  return out;
}

function inCheck(s, color){
  const k = findKing(s.board, color);
  return k ? isAttacked(s.board, k[0], k[1], color==="w"?"b":"w") : false;
}

function insufficientMaterial(b){
  const pieces=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p=b[r][c];
    if(p && p.t!=="k") pieces.push(p);
  }
  if(pieces.length===0) return true;
  if(pieces.length===1 && (pieces[0].t==="b" || pieces[0].t==="n")) return true;
  return false;
}

function sanFor(s, m, p){
  if(m.castle) return m.castle==="K" ? "O-O" : "O-O-O";
  const dest = sqName(m.tr, m.tc);
  if(p.t==="p"){
    let out = (m.ep || s.board[m.tr][m.tc]) ? FILES[m.fc]+"x"+dest : dest;
    if(m.promo) out += "=" + (typeof m.promo === "string" ? m.promo.toUpperCase() : "Q");
    return out;
  }
  let out = p.t.toUpperCase();
  const others=[];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    if(r===m.fr && c===m.fc) continue;
    const q=s.board[r][c];
    if(q && q.c===p.c && q.t===p.t &&
       legalMoves(s,r,c).some(x=>x.tr===m.tr && x.tc===m.tc))
      others.push([r,c]);
  }
  if(others.length){
    const sameFile = others.some(([r,c])=>c===m.fc);
    const sameRank = others.some(([r,c])=>r===m.fr);
    if(!sameFile) out += FILES[m.fc];
    else if(!sameRank) out += String(8-m.fr);
    else out += FILES[m.fc] + String(8-m.fr);
  }
  if(s.board[m.tr][m.tc] || m.ep) out += "x";
  return out + dest;
}

/**
 * Apply a legal move to state S (mutates S). Returns {san}.
 * m: {fr,fc,tr,tc, promo?, ep?, castle?} — flags may be omitted;
 *    the engine re-derives them from the current position.
 */
function playMove(S, m, promoPiece){
  const p = S.board[m.fr][m.fc];
  if(!p || p.c !== S.turn) return null;
  // re-derive flags (ep / castle / promo) from the position
  const derived = legalMoves(S, m.fr, m.fc).find(x => x.tr===m.tr && x.tc===m.tc);
  if(!derived) return null;
  const move = {...derived};
  if(promoPiece) move.promo = promoPiece;

  const captured = move.ep ? S.board[move.fr][move.tc] : S.board[move.tr][move.tc];
  const san = sanFor(S, move, p);

  applyToBoard(S.board, move);
  if(captured) S.captured[p.c].push(captured.t);

  if(p.t==="k"){ S.castling[p.c+"K"]=false; S.castling[p.c+"Q"]=false; }
  if(move.fr===7 && move.fc===0) S.castling.wQ=false;
  if(move.fr===7 && move.fc===7) S.castling.wK=false;
  if(move.fr===0 && move.fc===0) S.castling.bQ=false;
  if(move.fr===0 && move.fc===7) S.castling.bK=false;
  if(move.tr===7 && move.tc===0) S.castling.wQ=false;
  if(move.tr===7 && move.tc===7) S.castling.wK=false;
  if(move.tr===0 && move.tc===0) S.castling.bQ=false;
  if(move.tr===0 && move.tc===7) S.castling.bK=false;

  S.ep = (p.t==="p" && Math.abs(move.tr-move.fr)===2) ? [(move.tr+move.fr)/2, move.fc] : null;
  S.halfmove = (p.t==="p" || captured) ? 0 : S.halfmove+1;
  S.turn = S.turn==="w" ? "b" : "w";
  S.lastMove = move;

  const opp = S.turn;
  const check = inCheck(S, opp);
  const hasMoves = allLegalMoves(S).length > 0;
  let suffix = "";
  if(!hasMoves){
    S.over = true;
    if(check){ S.winner = opp==="w" ? "b" : "w"; S.reason="checkmate"; suffix="#"; }
    else { S.winner=null; S.reason="stalemate"; }
  } else if(S.halfmove >= 100){
    S.over = true; S.winner=null; S.reason="50-move rule";
  } else if(insufficientMaterial(S.board)){
    S.over = true; S.winner=null; S.reason="insufficient material";
  } else if(check){
    suffix = "+";
  }
  S.moves.push(san + suffix);
  return {san: san + suffix};
}

const api = {
  GLYPH, FILES, sqName,
  initialState, cloneState,
  isAttacked, findKing,
  legalMoves, allLegalMoves, inCheck,
  insufficientMaterial, sanFor, playMove
};

if (typeof module !== "undefined" && module.exports) module.exports = api;
else global.Chess = api;
})(typeof window !== "undefined" ? window : globalThis);
