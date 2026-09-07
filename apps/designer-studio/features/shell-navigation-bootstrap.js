// Keep the first navigation screen usable even if a later editor initializer fails.
document.getElementById("enterDesignerFlow")?.addEventListener("click",()=>{
 document.getElementById("entryScreen")?.classList.add("hidden");
 document.getElementById("designerHome")?.classList.remove("hidden");
});
