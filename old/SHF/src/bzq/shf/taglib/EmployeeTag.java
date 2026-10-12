/*
 * Created on 23/10/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import javax.servlet.jsp.JspException;
import org.apache.struts.util.ResponseUtils;

import bzq.taglib.BaseHandlerTag;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class EmployeeTag extends BaseHandlerTag {

	protected int empid;
	protected String empname;
	

	public int doStartTag() throws JspException {
		StringBuffer results = new StringBuffer();
		
		
		if(empname==null || empname.trim().length() == 0)
			results.append("<span class=invalidEmployee>עובד לא קיים במערכת</span>");
		else
			results.append( "<a name="+empname+" class=employee_name href=\"/shf/employee/showCard.do?employeeId="+empid+ "\" target=frMain  > "+empname+ "</a>");
		
		ResponseUtils.write(pageContext, results.toString());
		return (SKIP_BODY);
	}
	/**
	 * @return
	 */
	public int getEmpid() {
		return empid;
	}

	/**
	 * @param string
	 */
	public void setEmpid(int id) {
		empid = id;
	}

	

	/**
	 * @return
	 */
	public String getEmpname() {
		return empname;
	}

	/**
	 * @param string
	 */
	public void setEmpname(String string) {
		empname = string;
	}

	

}
