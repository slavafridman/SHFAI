package bzq.shf.taglib;

import javax.servlet.jsp.PageContext;
import javax.servlet.jsp.tagext.TagSupport;

import org.apache.struts.action.Action;
import org.apache.struts.util.ResponseUtils;

import bzq.taglib.BaseHandlerTag;

/**
 * Custom tag that renders error messages if an appropriate request attribute
 * has been created.  The tag looks for a request attribute with a reserved
 * key, and assumes that it is either a String, a String array, containing
 * message keys to be looked up in the application's MessageResources, or
 * an object of type <code>org.apache.struts.action.ActionErrors</code>.
 * <p>
 * The following optional message keys will be utilized if corresponding
 * messages exist for them in the application resources:
 * <ul>
 * <li><b>errors.header</b> - If present, the corresponding message will be
 *     rendered prior to the individual list of error messages.
 * <li><b>errors.footer</b> - If present, the corresponding message will be
 *     rendered following the individual list of error messages.
 * <li><b>
 * </ul>
 *
 * @author Craig R. McClanahan
 * @version $Revision: 1.8 $ $Date: 2001/04/18 23:32:34 $
 */

public class ReloadErrorsTag extends BaseHandlerTag {

/**
 * The request attribute key for our error messages (if any).
 */
	protected String name = Action.ERROR_KEY;

/**
 * Insert the method's description here.
 * Creation date: (30/12/2002 13:58:15)
 * @return int
 * @exception javax.servlet.jsp.JspException The exception description.
 */
	public int doStartTag() throws javax.servlet.jsp.JspException {
		StringBuffer results = new StringBuffer("");
		Object value = pageContext.getAttribute(name, PageContext.REQUEST_SCOPE);
		if (value == null) {
			pageContext.removeAttribute(name, PageContext.SESSION_SCOPE);		
		} else
			pageContext.setAttribute(name, value , PageContext.SESSION_SCOPE);
		
		results.append("<script language=\"JavaScript\">");
		results.append("if(top.frMsgBar){top.frMsgBar.location=\"/shf/msgBar.do\";}");
		results.append("</script>");
	
	// Print this field to our output writer
		ResponseUtils.write(pageContext, results.toString());

	// Continue processing this page
		return (SKIP_BODY);
	}
}
