import { TemplateRuntime } from "../../template-runtime/dist/src/index.js";
import { LegacyProjectAdapter } from "./LegacyProjectAdapter.js";
import type { IntegrationSnapshot, LegacyProject } from "./types.js";

export class DesignerRuntimeBridge {
  constructor(private readonly adapter = new LegacyProjectAdapter(), private readonly runtime = new TemplateRuntime()) {}
  resolve(project: LegacyProject): IntegrationSnapshot {
    const template=this.adapter.toTemplate(project); const dataset=this.adapter.toDataset(project);
    const result=this.runtime.execute(template,dataset,{target:"screen",includeDiagnostics:true});
    return {template,dataset,document:result.document};
  }
}
