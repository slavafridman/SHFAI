/*
 * Created on 25/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import java.util.Vector;

import javax.servlet.jsp.JspException;

import org.apache.struts.util.ResponseUtils;

import bzq.shf.forms.EventReasonForm;
import bzq.taglib.BaseHandlerTag;
import bzq.utils.TablesContainer;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReasonMarkedTag extends BaseHandlerTag {
	protected String reason;
	
	/**
	 * @return
	 */
	public String getReason() {
		return reason;
	}

	/**
	 * @param string
	 */
	public void setReason(String string) {
		reason = string;
	}
	
	public int doStartTag() throws JspException {
		StringBuffer results = new StringBuffer();
		TablesContainer tablesContainer = 
				(TablesContainer) pageContext.getServletContext().getAttribute(bzq.utils.AppConstants.TABLES_KEY);
		Vector vec=tablesContainer.getTable("eventReasonCode");
		boolean found=false;
		for(int i=0;i<vec.size();i++){
			EventReasonForm event=(EventReasonForm)vec.get(i);
			if(event.getCode().equals(reason)){
				if(event.getReported()>0){
					results.append("כן");
				}else{
					results.append("לא");
				}
				found=true;
				break;
			}
		}
		if(!found) results.append("&nbsp;");
		
		ResponseUtils.write(pageContext, results.toString());
		return (SKIP_BODY);	
	}

}
