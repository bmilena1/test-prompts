document.addEventListener('DOMContentLoaded',()=>{
  const oldTextarea=document.getElementById('oldText');
  const newTextarea=document.getElementById('newText');
  const compareBtn=document.getElementById('compareBtn');
  const clearBtn=document.getElementById('clearBtn');
  const copyBtn=document.getElementById('copyBtn');
  const oldPasteBtn=document.getElementById('oldPasteBtn');
  const newPasteBtn=document.getElementById('newPasteBtn');
  const oldLang=document.getElementById('oldLang');
  const newLang=document.getElementById('newLang');
  const editorsSection=document.getElementById('editorsSection');
  const hideUnchangedCheckbox=document.getElementById('hideUnchanged');
  const caseSensitiveCheckbox=document.getElementById('caseSensitive');
  const layoutRadios=document.querySelectorAll('input[name="layout"]');
  const granularityRadios=document.querySelectorAll('input[name="granularity"]');
  
  let latestPatch = '';
  let diffGranularity = 'word'; // 'word' or 'char'
  let caseSensitive = false;
  let hideUnchangedLines = false;

  function escapeHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Initialize CodeMirror editors from textareas
  const oldEditor = CodeMirror.fromTextArea(oldTextarea, {lineNumbers:true,mode:'text/plain',viewportMargin: Infinity,lineWrapping:true});
  const newEditor = CodeMirror.fromTextArea(newTextarea, {lineNumbers:true,mode:'text/plain',viewportMargin: Infinity,lineWrapping:true});

  function modeFromSelect(val){
    switch(val){
      case 'javascript': return 'javascript';
      case 'python': return 'python';
      case 'java': return 'text/x-java';
      case 'html': return 'htmlmixed';
      case 'json': return {name:'javascript',json:true};
      case 'markdown': return 'markdown';
      default: return 'text/plain';
    }
  }

  function setModes(){
    oldEditor.setOption('mode', modeFromSelect(oldLang.value));
    newEditor.setOption('mode', modeFromSelect(newLang.value));
  }
  oldLang.addEventListener('change', setModes);
  newLang.addEventListener('change', setModes);
  setModes();

  // Clear existing highlight classes (for line-level only, not used with word-level)
  function clearMarks(editor){
    editor.clearHistory();
  }

  // Apply word-level diff highlighting only (no line-level)
  function applyDiffToEditors(oldStr, newStr){
    // clear all existing marks from both editors
    oldEditor.getAllMarks().forEach(m => m.clear());
    newEditor.getAllMarks().forEach(m => m.clear());
    editorsSection.classList.remove('hideUnchanged'); // Reset hide unchanged state
    
    // apply fresh word-level diffs
    applyWordDiffs(oldStr, newStr, oldEditor, newEditor);
  }

  // word-level or char-level inline diff highlighting — separate position tracking per editor
  function applyWordDiffs(oldStr, newStr, editor1, editor2){
    let oldWords, newWords;
    
    // Handle case-insensitive comparison by normalizing for diff calculation
    let oldStrForDiff = oldStr;
    let newStrForDiff = newStr;
    if(!caseSensitive){
      oldStrForDiff = oldStr.toLowerCase();
      newStrForDiff = newStr.toLowerCase();
    }
    
    if(diffGranularity === 'char'){
      // Character-level diff
      oldWords = oldStrForDiff.split('');
      newWords = newStrForDiff.split('');
    } else {
      // Word-level diff (default)
      oldWords = oldStrForDiff.match(/\S+|\s+/g) || [];
      newWords = newStrForDiff.match(/\S+|\s+/g) || [];
    }
    
    const wordDiff = Diff.diffArrays(oldWords, newWords);
    
    let charPosOld = 0;  // position in oldStr (for editor1)
    let charPosNew = 0;  // position in newStr (for editor2)
    
    wordDiff.forEach(part=>{
      if(part.removed){
        // Mark removed words only in editor1 (original)
        part.value.forEach(word=>{
          const startPos = editor1.posFromIndex(charPosOld);
          charPosOld += word.length;
          const endPos = editor1.posFromIndex(charPosOld);
          editor1.markText(startPos, endPos, {className:'cm-removed',backgroundColor:'rgba(219,83,70,0.6)'});
        });
      } else if(part.added){
        // Mark added words only in editor2 (revised)
        part.value.forEach(word=>{
          const startPos = editor2.posFromIndex(charPosNew);
          charPosNew += word.length;
          const endPos = editor2.posFromIndex(charPosNew);
          editor2.markText(startPos, endPos, {className:'cm-added',backgroundColor:'rgba(63,164,56,0.6)'});
        });
      } else {
        // Unchanged words - advance both position counters
        part.value.forEach(word=>{
          charPosOld += word.length;
          charPosNew += word.length;
        });
      }
    });
    
    // Apply hide unchanged lines if enabled
    if(hideUnchangedLines){
      editorsSection.classList.add('hideUnchanged');
    }
  }

  function createPatch(a,b){
    try{ latestPatch = Diff.createPatch('diff', a, b); }catch(e){ latestPatch = ''; }
  }

  // Sync scrolling between editors
  let syncing=false;
  function syncScroll(src, dest){
    src.on('scroll', ()=>{
      if(syncing) return;
      syncing = true;
      const info = src.getScrollInfo();
      dest.scrollTo(info.left, info.top);
      setTimeout(()=>syncing=false, 20);
    });
  }
  syncScroll(oldEditor, newEditor);
  syncScroll(newEditor, oldEditor);

  compareBtn.addEventListener('click', ()=>{
    const a = oldEditor.getValue();
    const b = newEditor.getValue();
    createPatch(a,b);
    applyDiffToEditors(a,b);
  });

  clearBtn.addEventListener('click', ()=>{
    oldEditor.setValue(''); newEditor.setValue(''); clearMarks(oldEditor); clearMarks(newEditor); latestPatch='';
  });

  copyBtn.addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(latestPatch || ''); copyBtn.textContent='Copied'; setTimeout(()=>copyBtn.textContent='Copy Diff',1200); }
    catch(e){ alert('Copy failed — your browser may not allow clipboard access.'); }
  });

  // keyboard shortcuts
  document.addEventListener('keydown', (e)=>{
    const meta = e.ctrlKey || e.metaKey; if(!meta) return;
    if(e.key === 'Enter'){ e.preventDefault(); compareBtn.click(); return; }
    const k = e.key.toLowerCase();
    if(k === 'l'){ e.preventDefault(); clearBtn.click(); return; }
    if(k === 'c' && e.shiftKey){ e.preventDefault(); copyBtn.click(); return; }
  });

  // paste buttons for CodeMirror
  oldPasteBtn?.addEventListener('click', async ()=>{
    try{ const text = await navigator.clipboard.readText(); oldEditor.setValue(text); }catch(e){ alert('Unable to read clipboard. Please paste manually.'); }
  });
  newPasteBtn?.addEventListener('click', async ()=>{
    try{ const text = await navigator.clipboard.readText(); newEditor.setValue(text); }catch(e){ alert('Unable to read clipboard. Please paste manually.'); }
  });

  // Tools: Layout toggle (Split/Unified)
  layoutRadios.forEach(radio=>{
    radio.addEventListener('change', (e)=>{
      if(e.target.value === 'unified'){
        editorsSection.classList.add('unified-mode');
      } else {
        editorsSection.classList.remove('unified-mode');
      }
    });
  });

  // Tools: Diff Granularity toggle (Word/Char)
  granularityRadios.forEach(radio=>{
    radio.addEventListener('change', (e)=>{
      diffGranularity = e.target.value;
      // Re-compare if there's content
      if(oldEditor.getValue() && newEditor.getValue()){
        compareBtn.click();
      }
    });
  });

  // Tools: Hide unchanged lines toggle
  hideUnchangedCheckbox?.addEventListener('change', (e)=>{
    hideUnchangedLines = e.target.checked;
    if(hideUnchangedLines){
      editorsSection.classList.add('hideUnchanged');
    } else {
      editorsSection.classList.remove('hideUnchanged');
    }
  });

  // Tools: Case-sensitive toggle
  caseSensitiveCheckbox?.addEventListener('change', (e)=>{
    caseSensitive = e.target.checked;
    // Re-compare if there's content
    if(oldEditor.getValue() && newEditor.getValue()){
      compareBtn.click();
    }
  });

});
