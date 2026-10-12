/*
 * Created on 20/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import bzq.forms.TableInfo;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class OrgUnitTableForm extends TableForm implements TableInfo{
	
	protected String type;
	protected String parent;
		
	static {
		
	    fieldsMapping.put("TYPE" , "type");
		fieldsMapping.put("PARENT" , "parent");
	}
	
	

	
	/**
	 * @return
	 */
	public java.lang.String getParent() {
		return parent;
	}

	/**
	 * @return
	 */
	public java.lang.String getType() {
		return type;
	}

	/**
	 * @param string
	 */
	public void setParent(java.lang.String string) {
		parent = string;
	}

	/**
	 * @param string
	 */
	public void setType(java.lang.String string) {
		type = string;
	}
	
	

}
