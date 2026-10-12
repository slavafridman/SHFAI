package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.bean.PeleIWDBean;
import bzq.shf.forms.TableForm;
import bzq.shf.model.IWDModel;
import bzq.shf.utils.ShfException;

public class ModuleCheckListTag extends CheckListTag {
	
	
	public Vector<TableForm> getList() {
		
		Vector<TableForm> modules = null;	// all modules
		Vector<TableForm> relevantModules = null;	// found modules for selected filters
		IWDModel model = new IWDModel();
		Vector<PeleIWDBean> empAndModules = null;
		try {
			empAndModules = model.getAllModules();
		} catch (ShfException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		if (empAndModules != null && empAndModules.size() > 0) {
			modules = new Vector<TableForm>();
			relevantModules = new Vector<TableForm>();
			irrelevantModules = new Vector<TableForm>();
			
			for (PeleIWDBean peleIWDBean : empAndModules) {
				TableForm tf = new TableForm();
				tf.setCode(String.valueOf(peleIWDBean.getModuleId()));
				tf.setDescription(peleIWDBean.getModuleTitle());
				modules.add(tf);

			}
			
//			for (TableForm module : modules) {
//				boolean found = false;
//				for (TableForm relModule : relevantModules) {
//					if (module.getCode().equals(relModule.getCode())) {
//						found = true;
//					}
//				}
//				if ( ! found) {
//					irrelevantModules.add(module);
//				}
//			}
		}
		
		return modules;
	}
}
