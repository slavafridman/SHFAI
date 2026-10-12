/*
 * Created on 21/06/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import javax.servlet.jsp.JspException;

import org.apache.struts.util.ResponseUtils;

import bzq.shf.utils.SHFTableUtils;
import bzq.taglib.BaseHandlerTag;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ActivityTag extends BaseHandlerTag {
	
	private String activity;
	
	public int doStartTag() throws JspException {
		StringBuffer results = new StringBuffer();
		String name=SHFTableUtils.getActivityName(activity);
		results.append(name);
		ResponseUtils.write(pageContext, results.toString());
		return (SKIP_BODY);	
	}
	/**
	 * @return
	 */
	public String getActivity() {
		return activity;
	}

	/**
	 * @param string
	 */
	public void setActivity(String string) {
		activity = string;
	}

}
