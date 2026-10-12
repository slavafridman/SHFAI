/*
 * Created on 19/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.HashMap;
import bzq.forms.TableInfo;
import bzq.shf.bean.ShfBaseBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class TableForm extends ShfBaseBean implements TableInfo{
	protected java.lang.String code;
	protected java.lang.String description;

	protected static HashMap fieldsMapping= null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("CODE" , "code");
		fieldsMapping.put("DESCRIPTION" , "description");
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (27/01/2002 14:28:44)
	 * @return java.lang.String
	 */
	public java.lang.String getCode() {
		return code;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (16/01/2002 10:32:07)
	 * @return java.lang.String
	 */
	public java.lang.String getDescription() {
		return description;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (27/01/2002 12:01:29)
	 * @return java.util.HashMap
	 */
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (27/01/2002 14:28:44)
	 * @param newCode java.lang.String
	 */
	public void setCode(java.lang.String newCode) {
		code = newCode;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (16/01/2002 10:32:07)
	 * @param newDescription java.lang.String
	 */
	public void setDescription(java.lang.String newDescription) {
		description = newDescription;
	}
	}
