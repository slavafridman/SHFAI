package bzq.shf.taglib;

import java.util.Date;
import java.util.Vector;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.tagext.TagSupport;

import org.apache.commons.validator.GenericValidator;
import org.apache.commons.validator.ValidatorUtil;
import org.apache.struts.util.RequestUtils;
import org.apache.struts.util.ResponseUtils;

import bzq.forms.TableInfo;
import bzq.shf.forms.ActivityForm;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.CodeTablesFinder;
import bzq.utils.TablesContainer;
import bzq.validator.Validator;

/**
 * Insert the type's description here.
 * Creation date: (28/10/2003 09:31:45)
 * @author: Eduard Katcherovski
 */
public class activityAimTableTag extends TagSupport{
	protected java.lang.String tableName;
	protected java.lang.String codeName;
	protected java.lang.String name;
	protected java.lang.String property;
	protected java.lang.String scope;
		
	
	
	

public java.lang.String getScope() {
		return scope;
	}
	public void setScope(java.lang.String scope) {
		this.scope = scope;
	}
public java.lang.String getName() {
		return name;
	}
	public void setName(java.lang.String name) {
		this.name = name;
	}
	public java.lang.String getProperty() {
		return property;
	}
	public void setProperty(java.lang.String property) {
		this.property = property;
	}
/**
 * TablesTag constructor comment.
 */
public activityAimTableTag() {
	super();
}
/**
 * Insert the method's description here.
 * Creation date: (28/10/2003 09:39:31)
 * @return java.lang.String
 */
public java.lang.String getCodeName() {
	return codeName;
}
/**
 * Insert the method's description here.
 * Creation date: (28/10/2003 09:34:45)
 * @return java.lang.String
 */
public java.lang.String getTableName() {
	return tableName;
}
/**
 * Insert the method's description here.
 * Creation date: (28/10/2003 09:39:31)
 * @param newCodeName java.lang.String
 */
public void setCodeName(java.lang.String newCodeName) {
	codeName = newCodeName;
}
/**
 * Insert the method's description here.
 * Creation date: (28/10/2003 09:34:45)
 * @param newTableName java.lang.String
 */
public void setTableName(java.lang.String newTableName) {
	tableName = newTableName;
}

	/**
	 * Insert the method's description here.
	 * Creation date: (28/10/2003 09:42:25)
	 * @return java.lang.String
	 * @exception javax.servlet.jsp.JspException The exception description.
	 */
	public int doStartTag() throws JspException {
	
	    TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
	    Vector table = tablesContainer.getTable(tableName);
	    
	   
	    
//---------------------------
	    Vector allActivities = tablesContainer.getTable(TablesConstants.ACTIVITY_TABLE);
	    Vector<ActivityForm> localAct = new Vector<ActivityForm>();
	    for (int i=0; i<allActivities.size(); i++){
	    	ActivityForm activity=(ActivityForm)allActivities.get(i);

	    	if (activity.getVirtualActivity()==null){
	    		if (activity.getCode().equals(codeName)){
	    		
	    			localAct.add(activity);
	    		}
	    	}
	    	
	    	
	    }
//	    table.addAll(localAct);
//---------------------------    
	    
	    try {
	    	if(GenericValidator.isBlankOrNull(codeName)){
	    		codeName = (String)RequestUtils.lookup(pageContext, name, property,scope );
	    	}
	    	
	        TableInfo tableInfo = CodeTablesFinder.findTableFormByCode(table, codeName);
	        
			String descaim=tableInfo.getDescription();
			
			if(descaim!=null){
				descaim=descaim.trim();
				descaim=SHFUtils.replace(descaim,"'","&#39;");
			}
				
	        ResponseUtils.write(pageContext,descaim);
	    } catch (Exception e) {
	        ResponseUtils.write(pageContext, "");
	    }
	    return (EVAL_BODY_INCLUDE);
	
	}
}
