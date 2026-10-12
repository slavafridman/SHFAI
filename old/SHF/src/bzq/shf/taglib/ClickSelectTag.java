/*
 * Created on 23/10/2008
 * itemid - the code value for the next window
 * fieldname - name of the field that should be create in the jsp and the form
 * fielddesc - the vale that will displayed 
 * uriaction - the uri action to active
 */
package bzq.shf.taglib;

import javax.servlet.jsp.JspException;
import org.apache.struts.util.ResponseUtils;
import bzq.taglib.BaseHandlerTag;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ClickSelectTag extends BaseHandlerTag {

	protected long itemid;
	protected String fieldname;
	protected String fielddesc;
	protected String uriaction;

	public int doStartTag() throws JspException {
		StringBuffer results = new StringBuffer();
		if(fielddesc==null || fielddesc.trim().length() == 0)
			results.append("<span class=invalidEmployee>עובד לא קיים במערכת</span>");
		else
			results.append("<a class=employee_name href=\""+uriaction+"?"+fieldname+"="+itemid+"\" target=frMain>"+fielddesc+"</a>");

		ResponseUtils.write(pageContext, results.toString());
		return (SKIP_BODY);
	}


	/**
	 * @return
	 */
	public String getFielddesc() {
		return fielddesc;
	}

	/**
	 * @return
	 */
	public String getFieldname() {
		return fieldname;
	}


	
	/**
	 * @param string
	 */
	public void setFielddesc(String string) {
		fielddesc = string;
	}

	/**
	 * @param string
	 */
	public void setFieldname(String string) {
		fieldname = string;
	}


	/**
	 * @return
	 */
	public long getItemid() {
		return itemid;
	}

	/**
	 * @param i
	 */
	public void setItemid(long i) {
		itemid = i;
	}

	/**
	 * @return
	 */
	public String getUriaction() {
		return uriaction;
	}

	/**
	 * @param string
	 */
	public void setUriaction(String string) {
		uriaction = string;
	}

}
