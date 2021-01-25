let applyChanges = false;
new Dialog({
  title: `Token Elevation Changer`,
  content: `
    <form>
      <div class="form-group">
        <label>Elevation Value:</label>
        <input id="token-elevation" name="token-elevation" type="number" step="1" defaultValue="0"/>
      </div>
    </form>
    `,
  buttons: {
    yes: {
      icon: "<i class='fas fa-check'></i>",
      label: `Apply Changes`,
      callback: () => applyChanges = true
    },
    no: {
      icon: "<i class='fas fa-times'></i>",
      label: `Cancel Changes`
    },
  },
  default: "yes",
  close: html => {
    if (applyChanges) {
      for ( let token of canvas.tokens.controlled ) {
       let elevation = html.find('[name="token-elevation"]')[0].value || "0";
       token.data.elevation=elevation;
      }
    }
  }
}).render(true);