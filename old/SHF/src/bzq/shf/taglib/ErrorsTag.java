package bzq.shf.taglib;

import java.util.Iterator;
import java.util.Locale;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.PageContext;
import javax.servlet.jsp.tagext.TagSupport;

import org.apache.struts.action.Action;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.util.MessageResources;
import org.apache.struts.util.RequestUtils;
import org.apache.struts.util.ResponseUtils;

import bzq.taglib.BaseHandlerTag;
import bzq.taglib.Constants;

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

public class ErrorsTag extends BaseHandlerTag {

/**
 * The default locale on our server.
 */
	protected static Locale defaultLocale = Locale.getDefault();

/**
 * The message resources for this package.
 */
	protected static MessageResources messages = MessageResources.getMessageResources(Constants.Package + ".LocalStrings");

// ----------------------------------------------------------- Properties
/**
 * The servlet context attribute key for our resources.
 */
	protected String bundle = Action.MESSAGES_KEY;
	protected int errorLength = 0;

/**
 * The session attribute key for our locale.
 */
	protected String locale = Action.LOCALE_KEY;

/**
 * The request attribute key for our error messages (if any).
 */
	protected String name = Action.ERROR_KEY;

/**
 * The name of the property for which error messages should be returned,
 * or <code>null</code> to return all errors.
 */
	protected String property = null;

// ------------------------------------------------------- Public Methods
/**
 * Render the specified error messages if there are any.
 * @exception JspException if a JSP exception has occurred
 */
	public int doStartTag() throws JspException {
		boolean msgIsError = false;
	
	// Were any error messages specified?
		ActionErrors errors = new ActionErrors();
		try {
			Object value = pageContext.getAttribute(name, PageContext.SESSION_SCOPE);
			if (value == null) {
			;
			} else if (value instanceof String) {
				errors.add(ActionErrors.GLOBAL_ERROR,
				new ActionError((String) value));
			} else if (value instanceof String[]) {
				String keys[] = (String[]) value;
				for (int i = 0; i < keys.length; i++)
					errors.add(ActionErrors.GLOBAL_ERROR,new ActionError(keys[i]));
			} else if (value instanceof ActionErrors) {
				errors = (ActionErrors) value;
			} else {
				JspException e = new JspException
				(messages.getMessage("errorsTag.errors",value.getClass().getName()));
				RequestUtils.saveException(pageContext, e);
				throw e;
			}
		} catch (Exception e) {
		;
		}
		
		if (errors.empty())
			return (EVAL_BODY_INCLUDE);

	// Check for presence of header and footer message keys
		boolean headerPresent =
		RequestUtils.present(pageContext, bundle, locale, "errors.header");
		boolean footerPresent = RequestUtils.present(pageContext, bundle, locale, "errors.footer");
        
	// Render the error messages appropriately
		StringBuffer results = new StringBuffer();
		String message = null;
		String tmpResults = "";
	
		if (headerPresent)
			message = RequestUtils.message(pageContext, bundle,locale, "errors.header");
	
		if (message != null) {
			results.append(message);
			results.append("\r\n");
		}
		Iterator reports = null;
		if (property == null){
			reports = errors.get("Success");
			if(!(reports.hasNext())){
				reports = errors.get();
				msgIsError = true;
			}
		} else {
			reports = errors.get(property);
		}
        
		while (reports.hasNext()) {
			ActionError report = (ActionError) reports.next();
			message = RequestUtils.message(pageContext, bundle,locale, report.getKey(),report.getValues());
			if (message != null) {
				results.append(message);
				results.append(" * ");
			}
		}

		message = null;
		if (footerPresent)
			message = RequestUtils.message(pageContext, bundle,locale, "errors.footer");

		if (message != null) {
			results.append(message);
			results.append("\r\n");
		}
 		
		if ((errorLength > 0) && (results.toString().length() > errorLength)) {
			tmpResults = results.toString().substring(0, errorLength-3);
			tmpResults = tmpResults.concat("... <span  title=\"");
			tmpResults = tmpResults.concat(results.toString());
			tmpResults = tmpResults.concat("\">[מידע נוסף]</span>");
			results = new StringBuffer();
			results.append(tmpResults);
		}
		if(msgIsError)
			results.append("<span id=\"msgIsError\" style=\"display:none;\">ERR</span>");
		else
			results.append("<span id=\"msgIsError\" style=\"display:none;\">INF</span>");

	// Print the results to our output writer
		ResponseUtils.write(pageContext, results.toString());
		pageContext.removeAttribute(name, PageContext.SESSION_SCOPE);	
	// Continue processing this page
		return (EVAL_BODY_INCLUDE);
    }
    
    public String getBundle() {
        return (this.bundle);
    }
    
/**
 * Insert the method's description here.
 * Creation date: (05/01/2003 09:59:11)
 * @return int
 */
	public int getErrorLength() {
		return errorLength;
	}
	
    public String getLocale() {
        return (this.locale);
	}
    
    public String getName() {
		return (this.name);
	}
    
	public String getProperty() {
		return (this.property);
	}
	
/**
 * Release any acquired resources.
 */
	public void release() {
		super.release();
		bundle = Action.MESSAGES_KEY;
		locale = Action.LOCALE_KEY;
		name = Action.ERROR_KEY;
		property = null;
	}
	
	public void setBundle(String bundle) {
		this.bundle = bundle;
	}
	
/**
 * Insert the method's description here.
 * Creation date: (05/01/2003 09:59:11)
 * @param newErrorLength int
 */
	public void setErrorLength(int newErrorLength) {
		errorLength = newErrorLength;
	}
	
	public void setLocale(String locale) {
		this.locale = locale;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public void setProperty(String property) {
		this.property = property;
	}
}
