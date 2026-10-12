/*
 * Created on 03/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import java.text.DateFormat;
import java.util.Date;

import javax.servlet.jsp.JspException;

import org.apache.struts.util.ResponseUtils;

import bzq.taglib.BaseHandlerTag;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SHFDateTag extends SHFTimeTag {
	
		public SHFDateTag(){
			super();
			pattern="dd/MM/yyyy";
			orderBy="yyyyMMdd";
		}

	
}
