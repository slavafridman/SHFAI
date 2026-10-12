package bzq.shf.batch;

import bzq.shf.batch.beans.ProcessBean;

/**
 * Insert the type's description here.
 * Creation date: (05/12/2002 17:16:56)
 * @author: Natana Cohen
 */
public class BatchProcessInitializer extends bzq.utils.DigesterWrapper {
	private ProcessBean processBean = null;
	private String processName = null;
public BatchProcessInitializer(java.io.File xmlFile,  String processName) {
	super(xmlFile, 1, false);
	this.processName = processName;
}
/**
 * Insert the method's description here.
 * Creation date: (17/09/2003 14:00:34)
 * @return mdr.batch.beans.ProcessBean
 */
public ProcessBean getProcessBean() {
	return processBean;
}
/**
 * Construct and return a digester that uses the new configuration

   addRule("app-config/app-info/version-info", "bzq.utils.AppInfo", "setAppInfo");
 
 * file format.
 */
protected void initDigester() {
    addRule(
        "process-prop/" + processName,
        "bzq.shf.batch.beans.ProcessBean",
        "setProcessBean");
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:44:33)
 * @param newProcessBean mdr.batch.beans.ProcessBean
 */
public void setProcessBean(ProcessBean newProcessBean) {
	processBean = newProcessBean;
}
}
